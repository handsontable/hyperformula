import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { setCellError } from "../../../src/ui/popup/cellError";
import { ErrorPopup } from "../../../src/ui/popup/errorPopup";
import { PopupContext } from "../../../src/ui/popup/popupContext";
import { sel } from "../../helpers";

const PARSE_ERROR =
  "#ERROR! — Parsing error. Expecting: one of these possible Token sequences:\n" +
  "  1. [ProcedureName]\n" +
  "  2. [CellReference]\n" +
  "  3. [PlusOp]\n" +
  "but found: ''";
const REF_ERROR = "#REF! — Invalid reference.";
const DIV_ERROR = "#DIV/0! — Division by zero.";

function mutationsDelivered(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function idRefs(element: Element, attribute: string): string[] {
  return element.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? [];
}

describe("ErrorPopup error descriptions", () => {
  let popupCtx: PopupContext;
  let popup: ErrorPopup;
  let grid: HTMLElement;

  function popupId(): string {
    return popupCtx.portal.querySelector(sel(CN.errorPopup))?.id ?? "";
  }

  function descriptionNodes(): HTMLElement[] {
    return [...popupCtx.portal.querySelectorAll<HTMLElement>("[id*='-description-']")];
  }

  function packageIds(cell: HTMLElement): string[] {
    return idRefs(cell, "aria-describedby").filter((id) => id.includes("-description-"));
  }

  function descriptionOf(cell: HTMLElement): HTMLElement | null {
    const [id] = packageIds(cell);

    return id ? popupCtx.portal.querySelector<HTMLElement>(`[id="${id}"]`) : null;
  }

  function addCell(message: string | null): HTMLElement {
    const cell = document.createElement("div");

    cell.tabIndex = 0;
    grid.appendChild(cell);
    setCellError(cell, message);

    return cell;
  }

  beforeEach(() => {
    popupCtx = new PopupContext();
    popup = new ErrorPopup({ container: popupCtx.portal });
    grid = document.createElement("div");
    document.body.appendChild(grid);
    popup.attach(grid);
  });

  afterEach(() => {
    popup.destroy();
    popupCtx.destroy();
    grid.remove();
  });

  it("describes a marked cell with a hidden node in the portal while the popup is closed", async () => {
    const cell = addCell(DIV_ERROR);

    await mutationsDelivered();

    const node = descriptionOf(cell);

    expect(popup.isVisible()).toBe(false);
    expect(node?.textContent).toBe("Division by zero.");
    expect(node?.hidden).toBe(true);
    expect(node?.parentElement).toBe(popupCtx.portal);
    expect(idRefs(cell, "aria-describedby")).toEqual([node?.id]);
  });

  it("never writes aria-errormessage, so no attribute points at the hidden node", async () => {
    const cell = addCell(DIV_ERROR);

    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await mutationsDelivered();

    expect(popup.isVisible()).toBe(true);
    expect(cell.hasAttribute("aria-errormessage")).toBe(false);
    expect(cell.getAttribute("aria-invalid")).toBe("true");
  });

  it("keeps the same description id while the popup is open and never references the popup", async () => {
    const cell = addCell("#REF! — bad reference");

    await mutationsDelivered();

    const closedIds = idRefs(cell, "aria-describedby");

    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await mutationsDelivered();

    expect(popup.isVisible()).toBe(true);
    expect(idRefs(cell, "aria-describedby")).toEqual(closedIds);
    expect(idRefs(cell, "aria-describedby")).not.toContain(popupId());

    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(closedIds);
  });

  it("keeps the description after Escape closes the popup", async () => {
    const cell = addCell("#NAME? — Function name FOO not recognized.");

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await mutationsDelivered();

    expect(popup.isVisible()).toBe(false);
    expect(descriptionOf(cell)?.textContent).toBe("Function name FOO not recognized.");
  });

  it("describes a parse error with the first sentence of its message only", async () => {
    const cell = addCell(PARSE_ERROR);

    await mutationsDelivered();

    expect(descriptionOf(cell)?.textContent).toBe("Parsing error.");
  });

  it("cuts a long first sentence at a word boundary and ends it with an ellipsis", async () => {
    const body = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
    const cell = addCell(`#VALUE! — ${body}`);

    await mutationsDelivered();

    const text = descriptionOf(cell)?.textContent ?? "";
    const kept = text.slice(0, -1);

    expect(text.endsWith("…")).toBe(true);
    expect(kept.length).toBeLessThanOrEqual(120);
    expect(body.startsWith(kept)).toBe(true);
    expect(body.charAt(kept.length)).toBe(" ");
  });

  it("gives a cell whose error has no message no description, since its text shows the code", async () => {
    const cell = document.createElement("div");

    cell.setAttribute("aria-describedby", "col-header-2");
    grid.appendChild(cell);
    setCellError(cell, "#CYCLE!");
    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2"]);
    expect(descriptionNodes()).toEqual([]);
  });

  it("drops the description when the error changes to a bare code", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    setCellError(cell, "#REF!");
    await mutationsDelivered();

    expect(cell.hasAttribute("aria-describedby")).toBe(false);
    expect(descriptionNodes()).toEqual([]);
  });

  it("keeps the host's aria-describedby ids and lists ours once", async () => {
    const cell = document.createElement("div");

    cell.setAttribute("aria-describedby", "col-header-2");
    grid.appendChild(cell);
    setCellError(cell, REF_ERROR);
    await mutationsDelivered();

    const [id] = packageIds(cell);

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2", id]);

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2", id]);
  });

  it("puts the description after a header id the host writes after its render", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();

    const [id] = packageIds(cell);

    for (const name of cell.getAttributeNames()) {
      if (name.startsWith("aria-")) {
        cell.removeAttribute(name);
      }
    }

    setCellError(cell, REF_ERROR);

    if (!cell.hasAttribute("aria-describedby")) {
      cell.setAttribute("aria-describedby", "col-header-2");
    }

    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2", id]);
  });

  it("does not write aria-describedby while a host renderer calls syncCell", () => {
    const cell = addCell(DIV_ERROR);

    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    setCellError(cell, null);
    popup.syncCell(cell, DIV_ERROR);
    cell.removeAttribute("aria-describedby");
    setCellError(cell, REF_ERROR);
    popup.syncCell(cell, undefined);

    expect(popup.isVisible()).toBe(true);
    expect(cell.hasAttribute("aria-describedby")).toBe(false);
  });

  it("links a cell whose data-hfe-error the host writes directly", async () => {
    const cell = document.createElement("td");

    cell.setAttribute("data-hfe-error", "#N/A — Value not found.");
    grid.appendChild(cell);
    await mutationsDelivered();

    expect(descriptionOf(cell)?.textContent).toBe("Value not found.");
  });

  it("links error cells that are already in the grid when it attaches", () => {
    popup.detach();

    const cell = addCell(REF_ERROR);

    popup.attach(grid);

    expect(descriptionOf(cell)?.textContent).toBe("Invalid reference.");
  });

  it("keeps the description of a cell in a grid root that is inserted into the document later", async () => {
    popup.detach();
    grid.remove();

    const cell = addCell(REF_ERROR);

    popup.attach(grid);
    await mutationsDelivered();
    document.body.appendChild(grid);
    await mutationsDelivered();

    expect(descriptionOf(cell)?.textContent).toBe("Invalid reference.");
  });

  it("describes a cell marked while its grid root is out of the document", async () => {
    grid.remove();

    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    document.body.appendChild(grid);
    await mutationsDelivered();

    expect(descriptionOf(cell)?.textContent).toBe("Invalid reference.");
  });

  it("keeps a stable description while its grid root is out of the document", async () => {
    grid.remove();

    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    await mutationsDelivered();

    const writes: MutationRecord[] = [];
    const watcher = new MutationObserver((records) => writes.push(...records));

    watcher.observe(cell, { attributes: true, attributeFilter: ["aria-describedby"] });
    await mutationsDelivered();
    await mutationsDelivered();
    watcher.disconnect();

    expect(writes).toHaveLength(0);
    expect(descriptionOf(cell)?.textContent).toBe("Invalid reference.");
  });

  it("drops a cell removed from the grid root", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    cell.remove();
    await mutationsDelivered();

    expect(packageIds(cell)).toEqual([]);
    expect(descriptionNodes()).toHaveLength(0);
  });

  it("removes only its own ids when the error is cleared", async () => {
    const cell = document.createElement("div");

    cell.setAttribute("aria-describedby", "col-header-2");
    grid.appendChild(cell);
    setCellError(cell, REF_ERROR);
    await mutationsDelivered();
    setCellError(cell, null);
    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2"]);
    expect(descriptionNodes()).toEqual([]);
  });

  it("leaves no package id on a cell element reused for a non-error value", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    cell.removeAttribute("data-hfe-error");
    cell.textContent = "42";
    await mutationsDelivered();

    expect(cell.hasAttribute("aria-describedby")).toBe(false);
  });

  it("leaves an aria-errormessage the host wrote", async () => {
    const cell = addCell(REF_ERROR);

    cell.setAttribute("aria-errormessage", "host-error");
    await mutationsDelivered();
    setCellError(cell, null);
    await mutationsDelivered();

    expect(cell.getAttribute("aria-errormessage")).toBe("host-error");
  });

  it("moves the cell to a new description when its error text changes", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();

    const [firstId] = packageIds(cell);

    setCellError(cell, DIV_ERROR);
    await mutationsDelivered();

    expect(descriptionOf(cell)?.textContent).toBe("Division by zero.");
    expect(packageIds(cell)).toHaveLength(1);
    expect(packageIds(cell)).not.toContain(firstId);
    expect(descriptionNodes().map((node) => node.textContent)).toEqual(["Division by zero."]);
  });

  it("shares one description node between cells with the same description", async () => {
    const first = addCell(DIV_ERROR);
    const second = addCell(DIV_ERROR);
    const third = addCell(REF_ERROR);

    await mutationsDelivered();

    expect(packageIds(first)).toEqual(packageIds(second));
    expect(packageIds(third)).not.toEqual(packageIds(first));
    expect(descriptionNodes()).toHaveLength(2);
  });

  it("removes a description node once no cell uses it", async () => {
    const first = addCell(DIV_ERROR);
    const second = addCell(DIV_ERROR);

    await mutationsDelivered();
    setCellError(first, null);
    await mutationsDelivered();

    expect(descriptionNodes()).toHaveLength(1);

    second.remove();
    await mutationsDelivered();

    expect(descriptionNodes()).toEqual([]);
  });

  it("gives each popup instance its own description ids", async () => {
    const otherCtx = new PopupContext();
    const otherPopup = new ErrorPopup({ container: otherCtx.portal });
    const otherGrid = document.createElement("div");
    const otherCell = document.createElement("div");
    const cell = addCell(REF_ERROR);

    document.body.appendChild(otherGrid);
    otherPopup.attach(otherGrid);
    otherGrid.appendChild(otherCell);
    setCellError(otherCell, REF_ERROR);
    await mutationsDelivered();

    const [id] = packageIds(cell);

    expect(id).not.toBe(packageIds(otherCell)[0]);
    expect(id?.startsWith(`${popupId()}-description-`)).toBe(true);

    otherPopup.destroy();
    otherCtx.destroy();
    otherGrid.remove();
  });

  it("removes every description node and id on detach", async () => {
    const cell = document.createElement("div");

    cell.setAttribute("aria-describedby", "col-header-2");
    grid.appendChild(cell);
    setCellError(cell, REF_ERROR);
    await mutationsDelivered();
    popup.detach();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2"]);
    expect(descriptionNodes()).toEqual([]);

    setCellError(cell, DIV_ERROR);
    await mutationsDelivered();

    expect(idRefs(cell, "aria-describedby")).toEqual(["col-header-2"]);
  });

  it("removes every description node and id on destroy", async () => {
    const cell = addCell(REF_ERROR);

    await mutationsDelivered();
    popup.destroy();

    expect(cell.hasAttribute("aria-describedby")).toBe(false);
    expect(descriptionNodes()).toEqual([]);
  });
});
