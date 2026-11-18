import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { cellErrorMessage, setCellError } from "../../../src/ui/popup/cellError";
import { ErrorPopup } from "../../../src/ui/popup/errorPopup";
import { PopupContext } from "../../../src/ui/popup/popupContext";
import { sel } from "../../helpers";

describe("cellErrorMessage", () => {
  it("returns null for non-error values", () => {
    expect(cellErrorMessage(42)).toBe(null);
    expect(cellErrorMessage("text")).toBe(null);
    expect(cellErrorMessage(null)).toBe(null);
  });

  it("surfaces the HyperFormula-specific #CYCLE! error", () => {
    expect(cellErrorMessage({ type: "CYCLE", value: "#CYCLE!" })).toBe("#CYCLE!");
  });

  it("appends the message when present", () => {
    expect(cellErrorMessage({ type: "REF", value: "#REF!", message: "bad reference" })).toBe(
      "#REF! — bad reference",
    );
  });

  it("falls back to #<type> when no value string is given", () => {
    expect(cellErrorMessage({ type: "NAME" })).toBe("#NAME");
  });
});

describe("setCellError", () => {
  it("marks the cell invalid for assistive technology", () => {
    const cell = document.createElement("div");

    setCellError(cell, "#REF!");
    expect(cell.getAttribute("aria-invalid")).toBe("true");

    setCellError(cell, null);
    expect(cell.getAttribute("aria-invalid")).toBeNull();
  });
});

describe("ErrorPopup DOM rendering", () => {
  let popup: ErrorPopup;
  let popupCtx: PopupContext;

  beforeEach(() => {
    popupCtx = new PopupContext();
    popup = new ErrorPopup({ container: popupCtx.portal });
  });

  afterEach(() => {
    popup.destroy();
    popupCtx.destroy();
  });

  it("destroy() cancels a pending scroll reposition frame", () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(42);
    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});

    popup.attach(document.body);
    window.dispatchEvent(new Event("scroll"));
    popup.destroy();

    expect(cancelSpy).toHaveBeenCalledWith(42);
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it("follows a scroll inside the grid's shadow root, which never reaches the window", () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(7);
    const shadowHost = document.createElement("div");
    const shadowRoot = shadowHost.attachShadow({ mode: "open" });
    const grid = document.createElement("div");
    const scroller = document.createElement("div");

    document.body.appendChild(shadowHost);
    grid.appendChild(scroller);
    shadowRoot.appendChild(grid);
    popup.attach(grid);
    scroller.dispatchEvent(new Event("scroll"));

    expect(rafSpy).toHaveBeenCalled();

    popup.detach();
    rafSpy.mockRestore();
    shadowHost.remove();
  });

  it("renders only a title element when there is no separator", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#REF!";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: null }));
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
    expect(document.body.querySelector(sel(CN.errorPopupMessage))).toBeNull();
    popup.detach();
    cell.remove();
  });

  it("renders a title and a message element when the error contains ' — '", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#REF! — bad reference";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: null }));
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
    expect(document.body.querySelector(sel(CN.errorPopupMessage))?.textContent).toBe(
      "bad reference",
    );
    popup.detach();
    cell.remove();
  });

  it("opens on mouseover a cell with data-hfe-error and closes on mouseout", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("opens on focusin of a cell with data-hfe-error and closes on focusout", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    document.body.appendChild(cell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("opens on focusin of a cell whose direct child carries data-hfe-error", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    const marker = document.createElement("div");

    marker.dataset.hfeError = "#DIV/0!";
    cell.tabIndex = 0;
    cell.appendChild(marker);
    document.body.appendChild(cell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#DIV/0!");
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("reopens with the new message when focus moves to another cell wrapping an error marker", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    const otherCell = document.createElement("div");
    const otherMarker = document.createElement("div");

    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    otherMarker.dataset.hfeError = "#REF!";
    otherCell.tabIndex = 0;
    otherCell.appendChild(otherMarker);
    document.body.append(cell, otherCell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: otherCell }));
    otherCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
    popup.detach();
    cell.remove();
    otherCell.remove();
  });

  it("stays open on focusout when focus moves into the popup or another error cell", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    const otherCell = document.createElement("div");
    otherCell.dataset.hfeError = "#REF!";
    otherCell.tabIndex = 0;
    document.body.append(cell, otherCell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: otherCell }));
    expect(popup.isVisible()).toBe(true);

    const popupTitle = document.body.querySelector<HTMLElement>(sel(CN.errorPopupTitle));

    if (!popupTitle) {
      throw new Error("expected a visible popup title");
    }

    otherCell.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: popupTitle }),
    );
    expect(popup.isVisible()).toBe(true);
    popup.detach();
    cell.remove();
    otherCell.remove();
  });

  it("closes when focus tabs onward out of the popup itself", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    document.body.appendChild(cell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);

    const popupEl = document.body.querySelector<HTMLElement>(sel(CN.errorPopup));

    if (!popupEl) {
      throw new Error("expected the popup root element");
    }

    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: popupEl }));
    expect(popup.isVisible()).toBe(true);
    popupEl.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
    );
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("stays open on unrelated focus movement while the pointer rests on the error cell", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    const input = document.createElement("input");
    const otherInput = document.createElement("input");
    document.body.append(cell, input, otherInput);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: otherInput }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
    input.remove();
    otherInput.remove();
  });

  it("stays open on mouseout while the error cell keeps focus", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    document.body.appendChild(cell);
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(true);
    cell.blur();
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("re-anchors to the focused error cell when the pointer leaves another error cell", () => {
    popup.attach(document.body);
    const focusedCell = document.createElement("div");
    const hoveredCell = document.createElement("div");

    focusedCell.dataset.hfeError = "#NAME";
    focusedCell.tabIndex = 0;
    hoveredCell.dataset.hfeError = "#REF!";
    document.body.append(focusedCell, hoveredCell);
    focusedCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    hoveredCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");

    hoveredCell.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#NAME");

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(focusedCell.getAttribute("aria-errormessage")).toBe(popupRoot.id);
    expect(hoveredCell.getAttribute("aria-errormessage")).toBeNull();
    popup.detach();
    focusedCell.remove();
    hoveredCell.remove();
  });

  it("re-anchors to the hovered error cell when focus leaves another error cell", () => {
    popup.attach(document.body);
    const hoveredCell = document.createElement("div");
    const focusedCell = document.createElement("div");

    hoveredCell.dataset.hfeError = "#NAME";
    focusedCell.dataset.hfeError = "#REF!";
    focusedCell.tabIndex = 0;
    document.body.append(hoveredCell, focusedCell);
    hoveredCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    focusedCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");

    focusedCell.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#NAME");
    expect(hoveredCell.getAttribute("aria-errormessage")).not.toBeNull();
    expect(focusedCell.getAttribute("aria-errormessage")).toBeNull();
    popup.detach();
    hoveredCell.remove();
    focusedCell.remove();
  });

  it("detach() removes event listeners and closes the popup", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(true);
    popup.detach();
    expect(popup.isVisible()).toBe(false);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(false);
    cell.remove();
  });

  it("links the open popup to the cell via aria-errormessage, clearing it on close", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(popupRoot.id).toMatch(/^hfe-error-\d+$/);
    expect(cell.getAttribute("aria-errormessage")).toBe(popupRoot.id);

    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(cell.getAttribute("aria-errormessage")).toBeNull();

    popup.detach();
    cell.remove();
  });

  it("clears the previous cell's aria-errormessage when hopping directly between two error cells", () => {
    popup.attach(document.body);
    const cellA = document.createElement("div");
    const cellB = document.createElement("div");

    cellA.dataset.hfeError = "#NAME";
    cellA.tabIndex = 0;
    cellB.dataset.hfeError = "#REF!";
    cellB.tabIndex = 0;
    document.body.append(cellA, cellB);
    cellA.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(cellA.getAttribute("aria-errormessage")).not.toBeNull();

    cellA.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: cellB }));
    cellB.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: cellA }));

    expect(cellA.getAttribute("aria-errormessage")).toBeNull();

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(cellB.getAttribute("aria-errormessage")).toBe(popupRoot.id);

    popup.detach();
    cellA.remove();
    cellB.remove();
  });

  it("clears aria-errormessage when the popup is detached while open", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(cell.getAttribute("aria-errormessage")).not.toBeNull();

    popup.detach();
    expect(cell.getAttribute("aria-errormessage")).toBeNull();
    cell.remove();
  });

  it("appends the popup id to the cell's aria-describedby while open and restores it on close", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.setAttribute("aria-describedby", "col-header-2");
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(cell.getAttribute("aria-describedby")).toBe(`col-header-2 ${popupRoot.id}`);

    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(cell.getAttribute("aria-describedby")).toBe("col-header-2");

    popup.detach();
    cell.remove();
  });

  it("removes aria-describedby on close when the popup id was its only token", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(cell.getAttribute("aria-describedby")).toBe(popupRoot.id);

    popup.detach();
    expect(cell.hasAttribute("aria-describedby")).toBe(false);
    cell.remove();
  });

  it("drops the popup id from the previous cell's aria-describedby when hopping between error cells", () => {
    popup.attach(document.body);
    const cellA = document.createElement("div");
    const cellB = document.createElement("div");

    cellA.dataset.hfeError = "#NAME";
    cellA.tabIndex = 0;
    cellA.setAttribute("aria-describedby", "col-header-1");
    cellB.dataset.hfeError = "#REF!";
    cellB.tabIndex = 0;
    document.body.append(cellA, cellB);
    cellA.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    cellA.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: cellB }));
    cellB.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: cellA }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(cellA.getAttribute("aria-describedby")).toBe("col-header-1");
    expect(cellB.getAttribute("aria-describedby")).toBe(popupRoot.id);

    popup.detach();
    cellA.remove();
    cellB.remove();
  });

  it("does not repeat the popup id when focus and hover anchor the same cell", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    cell.tabIndex = 0;
    cell.setAttribute("aria-describedby", "col-header-2");
    document.body.appendChild(cell);
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;

    expect(cell.getAttribute("aria-describedby")).toBe(`col-header-2 ${popupRoot.id}`);

    popup.detach();
    expect(cell.getAttribute("aria-describedby")).toBe("col-header-2");
    cell.remove();
  });

  it("does not open when the hovered element has no data-hfe-error", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });

  it("renders no close button by default", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
    popup.detach();
    cell.remove();
  });

  it("reopens on the next mouseover after an explicit close", () => {
    const closablePopup = new ErrorPopup({
      container: popupCtx.portal,
      options: { showClose: true },
    });
    closablePopup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    expect(closablePopup.isVisible()).toBe(false);

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(closablePopup.isVisible()).toBe(true);

    closablePopup.destroy();
    cell.remove();
  });

  it("does not re-anchor to a stale cell after a close-button dismissal", () => {
    const closablePopup = new ErrorPopup({
      container: popupCtx.portal,
      options: { showClose: true },
    });
    closablePopup.attach(document.body);
    const hoveredCell = document.createElement("div");
    const focusedCell = document.createElement("div");

    hoveredCell.dataset.hfeError = "#NAME";
    focusedCell.dataset.hfeError = "#REF!";
    focusedCell.tabIndex = 0;
    document.body.append(hoveredCell, focusedCell);
    hoveredCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    const popupRoot = btn.closest(sel(CN.errorPopup)) as HTMLElement;

    hoveredCell.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: popupRoot }),
    );
    btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(closablePopup.isVisible()).toBe(false);

    focusedCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(closablePopup.isVisible()).toBe(true);

    focusedCell.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(closablePopup.isVisible()).toBe(false);

    closablePopup.destroy();
    hoveredCell.remove();
    focusedCell.remove();
  });

  it("stays closed when a focusout fires from inside the close sequence", () => {
    class ReentrantFocusoutErrorPopup extends ErrorPopup {
      private dispatched = false;

      protected override onVisibilityChanged(visible: boolean): void {
        if (!visible && !this.dispatched) {
          this.dispatched = true;
          this.root.dispatchEvent(
            new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
          );
        }

        super.onVisibilityChanged(visible);
      }
    }

    const reentrantPopup = new ReentrantFocusoutErrorPopup({
      container: popupCtx.portal,
      options: { showClose: true },
    });
    reentrantPopup.attach(document.body);
    const hoveredCell = document.createElement("div");
    const focusedCell = document.createElement("div");

    hoveredCell.dataset.hfeError = "#NAME";
    focusedCell.dataset.hfeError = "#REF!";
    focusedCell.tabIndex = 0;
    document.body.append(hoveredCell, focusedCell);
    hoveredCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    focusedCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(reentrantPopup.isVisible()).toBe(true);

    const btn = document.body.querySelector<HTMLButtonElement>(sel(CN.popupClose));

    if (!btn) {
      throw new Error("expected close button");
    }

    btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(reentrantPopup.isVisible()).toBe(false);

    reentrantPopup.destroy();
    hoveredCell.remove();
    focusedCell.remove();
  });

  it("stays open when the mouse moves from the errored cell onto the popup itself", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: popupRoot }));

    expect(popup.isVisible()).toBe(true);
    popup.detach();
    cell.remove();
  });

  it("closes when the mouse leaves the popup without returning to the errored cell", () => {
    popup.attach(document.body);
    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const popupRoot = document.body.querySelector(sel(CN.errorPopup)) as HTMLElement;
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: popupRoot }));
    popupRoot.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(popup.isVisible()).toBe(false);
    popup.detach();
    cell.remove();
  });
});

describe("ErrorPopup Escape dismissal", () => {
  let popup: ErrorPopup;
  let popupCtx: PopupContext;
  let cell: HTMLElement;

  function pressEscape(): KeyboardEvent {
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    return event;
  }

  beforeEach(() => {
    popupCtx = new PopupContext();
    popup = new ErrorPopup({ container: popupCtx.portal });
    popup.attach(document.body);
    cell = document.createElement("div");
    cell.dataset.hfeError = "#REF!";
    cell.tabIndex = 0;
    document.body.appendChild(cell);
  });

  afterEach(() => {
    popup.destroy();
    popupCtx.destroy();
    cell.remove();
  });

  it("closes the visible tooltip on Escape and consumes the key", () => {
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    const event = pressEscape();

    expect(popup.isVisible()).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("clears aria-errormessage when Escape closes the tooltip", () => {
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(cell.getAttribute("aria-errormessage")).not.toBeNull();

    pressEscape();

    expect(cell.getAttribute("aria-errormessage")).toBeNull();
  });

  it("ignores Escape while no tooltip is visible", () => {
    const event = pressEscape();

    expect(event.defaultPrevented).toBe(false);
  });

  it("suppresses reopening from the same cell until pointer and focus leave", () => {
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);

    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
  });

  it("keeps suppression while the dismissed cell still holds focus", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);

    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    cell.blur();
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
  });

  it("keeps suppression while the pointer stays on the dismissed cell", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    cell.blur();
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);

    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
  });

  it("keeps suppression when focus moves away while the pointer stays parked on the cell", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.blur();
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);
  });

  it("leaves Escape to the fn-help dialog while it holds focus", () => {
    const fnHelp = document.createElement("div");
    const button = document.createElement("button");

    fnHelp.className = CN.fnHelp;
    fnHelp.appendChild(button);
    document.body.appendChild(fnHelp);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    button.focus();
    const event = pressEscape();

    expect(event.defaultPrevented).toBe(false);
    expect(popup.isVisible()).toBe(true);

    fnHelp.remove();
  });

  it("leaves Escape to the formula bar while the address box holds focus", () => {
    const bar = document.createElement("div");
    const addressInput = document.createElement("input");

    bar.className = CN.formulaBar;
    bar.appendChild(addressInput);
    document.body.appendChild(bar);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    addressInput.focus();
    const event = pressEscape();

    expect(event.defaultPrevented).toBe(false);
    expect(popup.isVisible()).toBe(true);

    bar.remove();
  });

  it("leaves Escape to the editor while the editor holds focus", () => {
    const editorRoot = document.createElement("div");
    const textarea = document.createElement("textarea");

    editorRoot.className = CN.editor;
    editorRoot.appendChild(textarea);
    document.body.appendChild(editorRoot);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    textarea.focus();
    const event = pressEscape();

    expect(event.defaultPrevented).toBe(false);
    expect(popup.isVisible()).toBe(true);

    editorRoot.remove();
  });

  it("closes the stale tooltip when the pointer returns to the Escape-dismissed cell", () => {
    const otherCell = document.createElement("div");

    otherCell.dataset.hfeError = "#NAME?";
    document.body.appendChild(otherCell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: otherCell }));
    otherCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    otherCell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: cell }));
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);

    otherCell.remove();
  });

  it("closes instead of re-anchoring to the suppressed cell when the pointer leaves another error cell", () => {
    const otherCell = document.createElement("div");

    otherCell.dataset.hfeError = "#NAME";
    document.body.appendChild(otherCell);
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);

    otherCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    otherCell.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(popup.isVisible()).toBe(false);
    expect(otherCell.getAttribute("aria-errormessage")).toBeNull();
    otherCell.remove();
  });

  it("keeps suppression while the pointer rests on the dismissed cell across other-cell tooltips", () => {
    const otherCell = document.createElement("div");

    otherCell.dataset.hfeError = "#NAME";
    otherCell.tabIndex = 0;
    document.body.appendChild(otherCell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    otherCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);

    otherCell.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
    );

    expect(popup.isVisible()).toBe(false);

    otherCell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    otherCell.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }),
    );
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(false);
    otherCell.remove();
  });

  it("drops stored cell references that are no longer connected", () => {
    const otherCell = document.createElement("div");

    otherCell.dataset.hfeError = "#NAME";
    document.body.appendChild(otherCell);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    cell.remove();
    document.body.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: otherCell }),
    );

    const internals = popup as unknown as {
      activeCell: HTMLElement | null;
      pointerCell: HTMLElement | null;
      focusCell: HTMLElement | null;
      suppressedCell: HTMLElement | null;
    };

    expect(internals.suppressedCell).toBeNull();
    expect(internals.pointerCell).toBeNull();
    expect(internals.activeCell).toBeNull();
    expect(internals.focusCell).toBeNull();
    otherCell.remove();
  });

  it("clears suppression on detach", () => {
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    pressEscape();
    popup.detach();
    popup.attach(document.body);
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
  });
});

describe("ErrorPopup RTL positioning", () => {
  const mockRect = (
    element: HTMLElement,
    rect: { left?: number; top?: number; width?: number; height?: number },
  ): void => {
    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: rect.left ?? 0,
          top: rect.top ?? 0,
          width: rect.width ?? 0,
          height: rect.height ?? 0,
        }) as DOMRect,
      configurable: true,
    });
  };

  it("opens to the left of the anchor when direction is rtl", () => {
    const popupCtx = new PopupContext();
    const popup = new ErrorPopup({ container: popupCtx.portal, direction: "rtl" });
    const popupRoot = popupCtx.portal.querySelector<HTMLElement>(sel(CN.errorPopup));

    if (!popupRoot) {
      throw new Error("expected the popup root element");
    }

    mockRect(popupRoot, { width: 120, height: 40 });
    popup.attach(document.body);

    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    mockRect(cell, { left: 500, top: 100, width: 80, height: 20 });

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
    expect(Number.parseFloat(popupRoot.style.left)).toBeLessThan(500);

    popup.destroy();
    popupCtx.destroy();
    cell.remove();
  });

  it("opens to the right of the anchor when direction is ltr (default)", () => {
    const popupCtx = new PopupContext();
    const popup = new ErrorPopup({ container: popupCtx.portal });
    const popupRoot = popupCtx.portal.querySelector<HTMLElement>(sel(CN.errorPopup));

    if (!popupRoot) {
      throw new Error("expected the popup root element");
    }

    mockRect(popupRoot, { width: 120, height: 40 });
    popup.attach(document.body);

    const cell = document.createElement("div");
    cell.dataset.hfeError = "#NAME";
    document.body.appendChild(cell);
    mockRect(cell, { left: 500, top: 100, width: 80, height: 20 });

    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
    expect(Number.parseFloat(popupRoot.style.left)).toBeGreaterThan(500);

    popup.destroy();
    popupCtx.destroy();
    cell.remove();
  });
});

describe("ErrorPopup syncCell", () => {
  let popup: ErrorPopup;
  let popupCtx: PopupContext;
  let cell: HTMLElement;

  beforeEach(() => {
    popupCtx = new PopupContext();
    popup = new ErrorPopup({ container: popupCtx.portal });
    popup.attach(document.body);
    cell = document.createElement("div");
    cell.tabIndex = 0;
    document.body.appendChild(cell);
    setCellError(cell, "#DIV/0!");
  });

  afterEach(() => {
    popup.destroy();
    popupCtx.destroy();
    cell.remove();
  });

  function remark(target: HTMLElement, message: string | null): void {
    const previousMessage = target.dataset.hfeError;

    setCellError(target, message);
    popup.syncCell(target, previousMessage);
  }

  function pressEscape(): void {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  function repaint(target: HTMLElement, message: string | null): void {
    for (const name of target.getAttributeNames()) {
      if (name.startsWith("aria-")) {
        target.removeAttribute(name);
      }
    }

    remark(target, message);

    if (!target.hasAttribute("aria-describedby")) {
      target.setAttribute("aria-describedby", "col-header-2");
    }
  }

  function popupId(): string | undefined {
    return document.body.querySelector(sel(CN.errorPopup))?.id;
  }

  it("restores the popup association after a repaint that strips aria attributes and keeps the error", async () => {
    cell.setAttribute("aria-describedby", "col-header-2");
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    repaint(cell, "#DIV/0!");
    await Promise.resolve();

    expect(cell.getAttribute("aria-describedby")).toBe(`col-header-2 ${popupId()}`);
    expect(cell.getAttribute("aria-errormessage")).toBe(popupId());
  });

  it("keeps the host's aria-describedby id when a repaint changes the anchored cell's error", async () => {
    cell.setAttribute("aria-describedby", "col-header-2");
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    repaint(cell, "#REF!");
    await Promise.resolve();

    expect(cell.getAttribute("aria-describedby")).toBe(`col-header-2 ${popupId()}`);
    expect(cell.getAttribute("aria-errormessage")).toBe(popupId());
  });

  it("leaves only the host's aria-describedby id when a repaint clears the anchored cell's error", async () => {
    cell.setAttribute("aria-describedby", "col-header-2");
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    repaint(cell, null);
    await Promise.resolve();

    expect(cell.getAttribute("aria-describedby")).toBe("col-header-2");
    expect(cell.getAttribute("aria-errormessage")).toBeNull();
  });

  it("closes the tooltip when the anchored cell's error is cleared", () => {
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    remark(cell, null);

    expect(popup.isVisible()).toBe(false);
    expect(cell.getAttribute("aria-errormessage")).toBeNull();
  });

  it("shows the new message when the anchored cell's error changes", () => {
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    remark(cell, "#REF! — bad reference");

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
    expect(document.body.querySelector(sel(CN.errorPopupMessage))?.textContent).toBe(
      "bad reference",
    );
    expect(cell.getAttribute("aria-errormessage")).toBe(
      document.body.querySelector(sel(CN.errorPopup))?.id,
    );
  });

  it("reopens the tooltip when a new error lands on the cell that still holds focus", () => {
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    remark(cell, null);
    remark(cell, "#REF!");

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
  });

  it("reopens the tooltip when a new error lands on the cell under the pointer", () => {
    cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    remark(cell, null);
    remark(cell, "#REF!");

    expect(popup.isVisible()).toBe(true);
  });

  it("keeps the tooltip closed when a new error lands on a cell that pointer and focus left", () => {
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    remark(cell, null);
    cell.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    remark(cell, "#REF!");

    expect(popup.isVisible()).toBe(false);
  });

  it("keeps the tooltip when another cell's error is cleared", () => {
    const other = document.createElement("div");
    document.body.appendChild(other);
    setCellError(other, "#NAME?");
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    remark(other, null);

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#DIV/0!");
    other.remove();
  });

  it("shows a new error on a cell whose previous error was dismissed with Escape", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    remark(cell, null);
    remark(cell, "#REF!");
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
  });

  it("keeps a tooltip dismissed with Escape closed when a repaint leaves the error unchanged", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    remark(cell, "#DIV/0!");

    expect(popup.isVisible()).toBe(false);
  });

  it("keeps every tooltip closed after Escape when a repaint leaves the hovered cell's error unchanged", () => {
    const hovered = document.createElement("div");
    document.body.appendChild(hovered);
    setCellError(hovered, "#NAME?");
    hovered.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    remark(cell, "#DIV/0!");
    remark(hovered, "#NAME?");

    expect(popup.isVisible()).toBe(false);
    hovered.remove();
  });

  it("shows the new error at once when the error of a cell dismissed with Escape changes", () => {
    cell.focus();
    cell.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    pressEscape();
    remark(cell, "#REF!");

    expect(popup.isVisible()).toBe(true);
    expect(document.body.querySelector(sel(CN.errorPopupTitle))?.textContent).toBe("#REF!");
  });
});
