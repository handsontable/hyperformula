import { beforeEach, describe, expect, it, vi } from "vitest";
import { singleCellSelection } from "../../src/adapter/range";
import { FormulaBarAddressBox } from "../../src/formulaBar/formulaBarAddressBox";

function sel(col: number, row: number) {
  return singleCellSelection({ sheet: "Sheet1", col, row });
}

function box(
  onNavigate = vi.fn(() => true),
  onNavigateRange = vi.fn(() => true),
  onInvalidInput = vi.fn(),
) {
  const addressBox = new FormulaBarAddressBox({ onNavigate, onNavigateRange, onInvalidInput });
  document.body.appendChild(addressBox.root);
  const input = addressBox.root.querySelector("input") as HTMLInputElement;

  return { addressBox, input, onNavigate, onNavigateRange, onInvalidInput };
}

function pressEnter(input: HTMLInputElement) {
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

describe("FormulaBarAddressBox", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the address as A1 notation", () => {
    const { addressBox, input } = box();

    addressBox.setSelection(sel(2, 1));

    expect(input.value).toBe("C2");
  });

  it("renders empty for null address", () => {
    const { addressBox, input } = box();

    addressBox.setSelection(null);

    expect(input.value).toBe("");
  });

  it("navigates on Enter with a valid A1 address (case-insensitive)", () => {
    const { input, onNavigate } = box();

    input.value = "b7";
    pressEnter(input);

    expect(onNavigate).toHaveBeenCalledWith({ col: 1, row: 6 });
  });

  it("reverts on Enter when input is not an A1 address", () => {
    const { addressBox, input, onNavigate } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "not-a-ref";
    pressEnter(input);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(input.value).toBe("A1");
  });

  it("reverts when onNavigate rejects the target", () => {
    const { addressBox, input } = box(vi.fn(() => false));

    addressBox.setSelection(sel(0, 0));
    input.value = "ZZ999";
    pressEnter(input);

    expect(input.value).toBe("A1");
  });

  it("keeps the accepted address after navigate blurs the input", () => {
    const { addressBox, input } = box();

    addressBox.setSelection(sel(0, 0));
    input.focus();
    input.value = "b7";
    pressEnter(input);

    expect(input.value).toBe("B7");
  });

  it("carries a generated id for form-field association", () => {
    const { input } = box();

    expect(input.id).toMatch(/^hfe-formula-bar__address-input-\d+$/);
  });

  it("reports a rejected address through onInvalidInput", () => {
    const { addressBox, input, onInvalidInput } = box(vi.fn(() => false));

    addressBox.setSelection(sel(0, 0));
    input.value = "ZZZ99999";
    pressEnter(input);

    expect(onInvalidInput).toHaveBeenCalledWith("ZZZ99999");
    expect(input.value).toBe("A1");
  });

  it("stays silent and reverts on Enter with an empty input", () => {
    const { addressBox, input, onInvalidInput, onNavigate } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "";
    pressEnter(input);

    expect(onInvalidInput).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(input.value).toBe("A1");
  });

  it("stays silent on Escape and blur reverts", () => {
    const { addressBox, input, onInvalidInput } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "B2";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    input.value = "B2";
    input.dispatchEvent(new Event("blur"));

    expect(onInvalidInput).not.toHaveBeenCalled();
  });

  it("stays silent on a successful commit", () => {
    const { addressBox, input, onInvalidInput } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "B2";
    pressEnter(input);

    expect(onInvalidInput).not.toHaveBeenCalled();
  });

  it("reverts on Escape and on blur", () => {
    const { addressBox, input } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "D4";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(input.value).toBe("A1");

    input.value = "E5";
    input.dispatchEvent(new FocusEvent("blur"));

    expect(input.value).toBe("A1");
  });

  it("stops mousedown from bubbling past the address box root", () => {
    const { addressBox } = box();
    const outerListener = vi.fn();

    document.body.addEventListener("mousedown", outerListener);
    addressBox.root.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.body.removeEventListener("mousedown", outerListener);

    expect(outerListener).not.toHaveBeenCalled();
  });

  it("renders a multi-cell selection as start:end", () => {
    const { addressBox, input } = box();

    addressBox.setSelection({
      active: { sheet: "Sheet1", col: 0, row: 0 },
      range: {
        start: { sheet: "Sheet1", col: 0, row: 0 },
        end: { sheet: "Sheet1", col: 1, row: 4 },
      },
    });

    expect(input.value).toBe("A1:B5");
  });

  it("navigates a range on Enter, normalized (case-insensitive)", () => {
    const { input, onNavigate, onNavigateRange } = box();

    input.value = "b5:a1";
    pressEnter(input);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onNavigateRange).toHaveBeenCalledWith({
      start: { col: 0, row: 0 },
      end: { col: 1, row: 4 },
    });
    expect(input.value).toBe("A1:B5");
  });

  it("reverts when onNavigateRange rejects", () => {
    const { addressBox, input } = box(
      vi.fn(() => true),
      vi.fn(() => false),
    );

    addressBox.setSelection(sel(0, 0));
    input.value = "A1:ZZ999";
    pressEnter(input);

    expect(input.value).toBe("A1");
  });

  it("reverts on a malformed range", () => {
    const { addressBox, input, onNavigateRange } = box();

    addressBox.setSelection(sel(0, 0));
    input.value = "A1:B";
    pressEnter(input);

    expect(onNavigateRange).not.toHaveBeenCalled();
    expect(input.value).toBe("A1");
  });
});
