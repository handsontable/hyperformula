import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormulaBarCell } from "../../src/formulaBar/formulaBarCell";
import { CN } from "../../src/theme/classNames";

function cell(knownFunctions = new Set(["SUM"]), onActivate = vi.fn()) {
  const formulaCell = new FormulaBarCell({ knownFunctions, onActivate });
  document.body.appendChild(formulaCell.root);
  const idleEl = formulaCell.root.querySelector(`.${CN.formulaBarIdle}`) as HTMLElement;

  return { container: formulaCell.root, formulaCell, onActivate, idleEl };
}

describe("FormulaBarCell", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the fx icon", () => {
    const { container } = cell();

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders idle formula with ref rainbow marks", () => {
    const { container, formulaCell } = cell();

    formulaCell.renderValue("=C2*C3");

    const marks = container.querySelectorAll("[data-ref-index]");
    expect(marks).toHaveLength(2);
    expect(marks[0]?.getAttribute("data-ref-index")).not.toBe(
      marks[1]?.getAttribute("data-ref-index"),
    );
    expect(container.textContent).toContain("=C2*C3");
  });

  it("marks unknown functions", () => {
    const { container, formulaCell } = cell(new Set(["SUM"]));

    formulaCell.renderValue("=NOPE(1)");

    expect(container.querySelector(".hfe-token--fn-unknown")).not.toBeNull();
  });

  it("toggles overlay visibility without touching idle content", () => {
    const { formulaCell } = cell();

    formulaCell.setOverlayVisible(true);
    expect(formulaCell.overlayMount.hidden).toBe(false);

    formulaCell.setOverlayVisible(false);
    expect(formulaCell.overlayMount.hidden).toBe(true);
  });

  it("fires onActivate on idle mousedown and stops propagation", () => {
    const { container, formulaCell, onActivate } = cell();
    const outerListener = vi.fn();

    document.body.addEventListener("mousedown", outerListener);
    formulaCell.renderValue("=1");
    const idle = container.querySelector(".hfe-formula-bar__idle") as HTMLElement;
    idle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.body.removeEventListener("mousedown", outerListener);

    expect(onActivate).toHaveBeenCalledOnce();
    expect(outerListener).not.toHaveBeenCalled();
  });

  it("exposes the idle cell as a focusable textbox placeholder", () => {
    const { idleEl } = cell();

    expect(idleEl.getAttribute("tabindex")).toBe("0");
    expect(idleEl.getAttribute("aria-label")).toBe("Formula input");
    expect(idleEl.getAttribute("role")).toBe("textbox");
    expect(idleEl.getAttribute("aria-readonly")).toBeNull();
  });

  it("exposes the idle formula value to assistive technology", () => {
    const { container, formulaCell } = cell();

    formulaCell.renderValue("=SUM(A1)");

    const idleOverlayRoot = container.querySelector(".hfe-formula-bar__idle .hfe-overlay");

    expect(idleOverlayRoot?.getAttribute("aria-hidden")).toBeNull();
    expect(container.querySelector(".hfe-formula-bar__idle")?.textContent).toContain("=SUM(A1)");
  });

  it("activates on focus", () => {
    const { idleEl, onActivate } = cell();

    idleEl.dispatchEvent(new FocusEvent("focus"));

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("keeps single activation on mouse click", () => {
    const { idleEl, onActivate } = cell();
    const mouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });

    idleEl.dispatchEvent(mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("removes the placeholder from the tab order while the overlay editor is shown", () => {
    const { idleEl, formulaCell } = cell();

    formulaCell.setOverlayVisible(true);
    expect(idleEl.getAttribute("tabindex")).toBe("-1");

    formulaCell.setOverlayVisible(false);
    expect(idleEl.getAttribute("tabindex")).toBe("0");
  });

  it("hides the idle textbox from assistive tech while the overlay editor is shown", () => {
    const { idleEl, formulaCell } = cell();

    formulaCell.setOverlayVisible(true);
    expect(idleEl.getAttribute("aria-hidden")).toBe("true");
    expect(idleEl.getAttribute("tabindex")).toBe("-1");

    formulaCell.setOverlayVisible(false);
    expect(idleEl.getAttribute("aria-hidden")).toBeNull();
    expect(idleEl.getAttribute("tabindex")).toBe("0");
  });
});
