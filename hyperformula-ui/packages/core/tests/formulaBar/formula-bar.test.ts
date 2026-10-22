import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { singleCellSelection } from "../../src/adapter/range";
import type { CellRange, IGridAdapter, RefSelectionColorResolver } from "../../src/adapter/types";
import { FormulaBarCell } from "../../src/formulaBar/formulaBarCell";
import { FormulaEditor as FormulaEditorImpl } from "../../src/formulaEditor/formulaEditor";
import { REF_PALETTE } from "../../src/theme/refPalette";
import type { LiveRegion } from "../../src/ui/liveRegion";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { makeBarAdapter, makeFormulaBar } from "../helpers";

let sharedPopupCtx: PopupContext;

beforeEach(() => {
  sharedPopupCtx = new PopupContext();
});

afterEach(() => {
  sharedPopupCtx.destroy();
});

function activeCellAtOrigin() {
  return { sheet: "", col: 0, row: 0 };
}

function makeEditor(adapter: IGridAdapter): FormulaEditorImpl {
  return new FormulaEditorImpl(document.createElement("div"), {
    popupCtx: sharedPopupCtx,
    adapter,
    onCommit: (value) => adapter.commit(value),
    onCancel: () => adapter.cancel(),
  });
}

function cellRange(col: number, row: number): CellRange {
  return { start: { sheet: "", col, row }, end: { sheet: "", col, row } };
}

function barValue(container: HTMLElement): string {
  return (container.querySelector("textarea") as HTMLTextAreaElement).value;
}

function placeholderEl(container: HTMLElement): HTMLElement {
  return container.querySelector(".hfe-formula-bar__idle") as HTMLElement;
}

function overlayEl(container: HTMLElement): HTMLElement {
  return container.querySelector(".hfe-formula-bar__overlay") as HTMLElement;
}

function addressInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector(".hfe-formula-bar__address-input") as HTMLInputElement;
}

describe("FormulaBar selection sync", () => {
  it("shows the current active cell in the bar immediately on construction", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({
      getActiveCell: () => ({ sheet: "", col: 0, row: 2 }),
      getCellFormula: (addr) => (addr.row === 2 ? "=SUM(A1:A2)" : ""),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    expect(barValue(container)).toBe("=SUM(A1:A2)");
    expect(addressInput(container).value).toBe("A3");
    controller.destroy();
    editor.destroy();
  });

  it("shows the active cell formula when the selection changes", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: (addr) => (addr.row === 2 ? "=SUM(A1:A2)" : ""),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireSelection(singleCellSelection({ sheet: "", col: 0, row: 2 }));

    expect(barValue(container)).toBe("=SUM(A1:A2)");
    controller.destroy();
    editor.destroy();
  });

  it("renders N() comments as // comments in the placeholder", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => '=A1 + N("note")',
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireSelection(singleCellSelection({ sheet: "", col: 0, row: 0 }));

    expect(placeholderEl(container).textContent).toContain("=A1 // note");
    controller.destroy();
    editor.destroy();
  });

  it("stops reacting to selection after destroy", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=9",
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    controller.destroy();
    fireSelection(singleCellSelection({ sheet: "", col: 0, row: 0 }));

    expect(container.querySelector("textarea")).toBeNull();
    editor.destroy();
  });
});

describe("FormulaBar single-editor host switch", () => {
  it("moves the one editor into the cell mount and seeds it on a cell-initiated edit", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=CELL");

    expect(mount.querySelector("textarea")).not.toBeNull();
    expect((mount.querySelector("textarea") as HTMLTextAreaElement).value).toBe("=CELL");
    controller.destroy();
    editor.destroy();
  });

  it("keeps the editor in the bar overlay on a bar-initiated edit and shows the overlay", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, _seed) => {
        fireInlineStart(mount, "=BAR");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(overlayEl(container).hidden).toBe(false);
    expect(container.querySelector("textarea")).not.toBeNull();
    expect(mount.querySelector("textarea")).toBeNull();
    controller.destroy();
    editor.destroy();
  });

  it("shows the bar overlay before attaching the editor to it on a bar-initiated edit", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: () => {
        fireInlineStart(mount, "=BAR");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });
    const overlayHiddenOnAttach: boolean[] = [];
    const attachTo = editor.attachTo.bind(editor);

    vi.spyOn(editor, "attachTo").mockImplementation((target) => {
      overlayHiddenOnAttach.push(target.hidden);
      attachTo(target);
    });
    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(overlayHiddenOnAttach).toEqual([false]);
    controller.destroy();
    editor.destroy();
  });

  it("opens a bar-initiated edit scrolled to the first line with the caret at the end", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const formula = "=SUM(\nA1,\nA2\n)";
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => formula,
      beginEdit: () => {
        fireInlineStart(mount, formula);

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });
    const textarea = container.querySelector("textarea");

    if (!textarea) {
      throw new Error("expected the bar editor textarea");
    }

    vi.spyOn(textarea, "focus").mockImplementation(() => {
      textarea.scrollTop = 40;
    });
    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(textarea.scrollTop).toBe(0);
    expect(editor.getCaretOffset()).toBe(formula.length);
    controller.destroy();
    editor.destroy();
  });

  it("keeps the caret line scrolled into view when switching from the cell to the bar", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=SUM(\nA1,\nA2\n)");

    const textarea = container.querySelector("textarea") ?? mount.querySelector("textarea");

    if (!textarea) {
      throw new Error("expected the editor textarea");
    }

    vi.spyOn(textarea, "focus").mockImplementation(() => {
      textarea.scrollTop = 40;
    });
    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(textarea.scrollTop).toBe(40);
    controller.destroy();
    editor.destroy();
  });

  it("shows the bar overlay before attaching the editor to it when switching from the cell", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=A1");

    const overlayHiddenOnAttach: boolean[] = [];
    const attachTo = editor.attachTo.bind(editor);

    vi.spyOn(editor, "attachTo").mockImplementation((target) => {
      overlayHiddenOnAttach.push(target.hidden);
      attachTo(target);
    });
    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(overlayHiddenOnAttach).toEqual([false]);
    controller.destroy();
    editor.destroy();
  });

  it("rolls back the bar session when beginEdit does not start an edit", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=1",
      beginEdit: () => false,
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(overlayEl(container).hidden).toBe(true);

    fireSelection(singleCellSelection({ sheet: "", col: 0, row: 2 }));
    expect(placeholderEl(container).textContent).toContain("=1");

    controller.destroy();
    editor.destroy();
  });

  it("hides the cell mount while bar-initiated editing and shows it while cell-initiated", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const visibility: boolean[] = [];
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      beginEdit: () => {
        fireInlineStart(mount, "");

        return true;
      },
      setInlineEditorVisible: (visible) => visibility.push(visible),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(visibility.at(-1)).toBe(false);

    controller.destroy();
    editor.destroy();
  });

  it("commits the open edit on Enter", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=X");
    const textarea = mount.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(adapter.commit).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("commits via onCommit when Enter is pressed even without an explicit open edit", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(adapter.commit).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("slides Tab off a clean bar-hosted editor without committing", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(event);

    expect(adapter.commit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    controller.destroy();
    editor.destroy();
  });

  it("slides Tab off a clean bar-hosted editor whose formula carries an N() comment", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => '=SUM(A1:A2)+N("note")',
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    textarea.dispatchEvent(event);

    expect(adapter.commit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    controller.destroy();
    editor.destroy();
  });

  it("commits on Tab once a formula with an N() comment is actually edited", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => '=SUM(A1:A2)+N("note")',
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=SUM(A1:A3) // note";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(adapter.commit).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("slides Shift+Tab off a clean bar-hosted editor without committing", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    textarea.dispatchEvent(event);

    expect(adapter.commit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    controller.destroy();
    editor.destroy();
  });

  it("commits on Tab once the bar-hosted editor is dirty", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=BAR+1";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(adapter.commit).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("closes the abandoned clean bar editor on blur after the tab slide, restoring idle", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    adapter.cancel = vi.fn(() => fireInlineClose());
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    textarea.dispatchEvent(new FocusEvent("blur", { relatedTarget: document.body }));

    expect(adapter.commit).not.toHaveBeenCalled();
    expect(adapter.cancel).toHaveBeenCalledOnce();
    expect(overlayEl(container).hidden).toBe(true);
    expect(placeholderEl(container).textContent).toContain("=BAR");
    controller.destroy();
    editor.destroy();
  });

  it("restores focus to the blur's relatedTarget after cancel steals it back", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const hostCell = document.createElement("td");
    document.body.append(container, mount, hostCell);
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    adapter.cancel = vi.fn(() => {
      fireInlineClose();
      hostCell.tabIndex = -1;
      hostCell.focus();
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    const addressInputEl = addressInput(container);

    textarea.dispatchEvent(new FocusEvent("blur", { relatedTarget: addressInputEl }));

    expect(document.activeElement).toBe(addressInputEl);
    controller.destroy();
    editor.destroy();
    container.remove();
    mount.remove();
    hostCell.remove();
  });

  it("leaves cancel's own focus placement untouched when the blur has no relatedTarget", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const hostCell = document.createElement("td");
    document.body.append(container, mount, hostCell);
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    adapter.cancel = vi.fn(() => {
      fireInlineClose();
      hostCell.tabIndex = -1;
      hostCell.focus();
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(() =>
      textarea.dispatchEvent(new FocusEvent("blur", { relatedTarget: null })),
    ).not.toThrow();
    expect(document.activeElement).toBe(hostCell);

    controller.destroy();
    editor.destroy();
    container.remove();
    mount.remove();
    hostCell.remove();
  });

  it("returns the editor to the bar overlay and refreshes the placeholder on close", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=COMMITTED",
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=DRAFT");
    fireInlineClose();

    expect(container.querySelector("textarea")).not.toBeNull();
    expect(overlayEl(container).hidden).toBe(true);
    expect(placeholderEl(container).textContent).toContain("=COMMITTED");
    controller.destroy();
    editor.destroy();
  });

  it("mirrors live typed text into the placeholder while cell-editing (read-only)", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "");
    const textarea = mount.querySelector("textarea") as HTMLTextAreaElement;
    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=A1+2";
    textarea.selectionStart = textarea.selectionEnd = 5;
    textarea.dispatchEvent(new Event("input"));

    expect(placeholderEl(container).textContent).toContain("=A1+2");
    controller.destroy();
    editor.destroy();
  });

  it("switches the editor back to the bar when the placeholder is clicked mid cell-edit", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=A1");
    expect(mount.querySelector("textarea")).not.toBeNull();

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(container.querySelector(".hfe-formula-bar__overlay textarea")).not.toBeNull();
    expect(overlayEl(container).hidden).toBe(false);
    controller.destroy();
    editor.destroy();
  });

  it("renders an fx affordance before the editor body", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    const fxIcon = container.querySelector(".hfe-formula-bar__fx-icon");
    const body = container.querySelector(".hfe-formula-bar__body");

    if (!fxIcon || !body) {
      throw new Error("expected fx icon and body in the bar container");
    }

    expect(fxIcon.nextElementSibling).toBe(body);
    expect(body.contains(placeholderEl(container))).toBe(true);
    expect(body.contains(overlayEl(container))).toBe(true);
    controller.destroy();
    editor.destroy();
  });

  it("provides a target-aware color resolver on inline edit start, and exits on close", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const resolvers: (RefSelectionColorResolver | undefined)[] = [];
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      enterRefSelectionMode: (resolveColor) => resolvers.push(resolveColor),
      exitRefSelectionMode: vi.fn(),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=A1+");

    const resolveColor = resolvers.at(-1);

    if (!resolveColor) {
      throw new Error("expected a color resolver");
    }

    expect(resolveColor(cellRange(2, 2), false)).toBe("var(--hfe-ref-2)");
    expect(resolveColor(cellRange(0, 0), false)).toBe("var(--hfe-ref-1)");

    fireInlineClose();

    expect(adapter.exitRefSelectionMode).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("removes the fx affordance and body on destroy", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    controller.destroy();

    expect(container.querySelector(".hfe-formula-bar__fx-icon")).toBeNull();
    expect(container.querySelector(".hfe-formula-bar__body")).toBeNull();
  });

  it("resolver stays fresh as refs are added within the same edit session", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const resolvers: (RefSelectionColorResolver | undefined)[] = [];
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      enterRefSelectionMode: (resolveColor) => resolvers.push(resolveColor),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "");

    const resolveColor = resolvers.at(-1);

    if (!resolveColor) {
      throw new Error("expected a color resolver");
    }

    const textarea = mount.querySelector("textarea") as HTMLTextAreaElement;

    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=A1+";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));

    expect(resolveColor(cellRange(2, 2), false)).toBe("var(--hfe-ref-2)");

    textarea.value = "=A1+B1+";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));

    expect(resolveColor(cellRange(2, 2), false)).toBe("var(--hfe-ref-3)");

    controller.destroy();
    editor.destroy();
  });

  it("resolves the post-delete ref count when a drag starts", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const resolvers: (RefSelectionColorResolver | undefined)[] = [];
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      enterRefSelectionMode: (resolveColor) => resolvers.push(resolveColor),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireInlineStart(mount, "=(D1-C1)*B1");

    const resolveColor = resolvers.at(-1);

    if (!resolveColor) {
      throw new Error("expected a color resolver");
    }

    const dragRange = cellRange(4, 4);

    expect(resolveColor(dragRange, false)).toBe(REF_PALETTE[3]);

    const textarea = mount.querySelector("textarea") as HTMLTextAreaElement;
    const nextText = "=(D1-C1)*";

    textarea.value = nextText;
    textarea.selectionStart = nextText.length;
    textarea.selectionEnd = nextText.length;
    textarea.dispatchEvent(new Event("input"));

    expect(resolveColor(dragRange, false)).toBe(REF_PALETTE[2]);

    controller.destroy();
    editor.destroy();
  });

  it("seeds beginEdit with the cell's current formula on focus activation", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=EXISTING",
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new FocusEvent("focus"));

    expect(adapter.beginEdit).toHaveBeenCalledWith(expect.anything(), "=EXISTING");
    controller.destroy();
    editor.destroy();
  });

  it("does not begin a second edit when the placeholder is activated mid-edit", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      beginEdit: vi.fn((_address, _seed) => {
        fireInlineStart(mount, "=1+1");

        return true;
      }),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new FocusEvent("focus"));
    placeholderEl(container).dispatchEvent(new FocusEvent("focus"));

    expect(adapter.beginEdit).toHaveBeenCalledTimes(1);
    controller.destroy();
    editor.destroy();
  });

  it("selects the first cell then begins editing when there is no active cell", () => {
    const container = document.createElement("div");
    let active: { sheet: string; col: number; row: number } | null = null;
    const { adapter } = makeBarAdapter({
      getActiveCell: () => active,
      getCellFormula: () => "=FIRST",
      selectFirstCell: vi.fn(() => {
        active = { sheet: "", col: 0, row: 0 };
      }),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new FocusEvent("focus"));

    expect(adapter.selectFirstCell).toHaveBeenCalledOnce();
    expect(adapter.beginEdit).toHaveBeenCalledWith({ sheet: "", col: 0, row: 0 }, "=FIRST");
    controller.destroy();
    editor.destroy();
  });

  it("adds className to the container when provided", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);

    const controller = makeFormulaBar(container, {
      adapter,
      editor,
      knownFunctions: new Set(),
      className: "ht-theme-main",
    });

    expect(container.classList.contains("ht-theme-main")).toBe(true);
    controller.destroy();
    editor.destroy();
  });

  it("sets dir=rtl on the bar container when direction is rtl", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);

    const controller = makeFormulaBar(container, {
      adapter,
      editor,
      knownFunctions: new Set(),
      direction: "rtl",
    });

    expect(container.getAttribute("dir")).toBe("rtl");
    controller.destroy();
    editor.destroy();
  });

  it("does not re-render the occluded idle view per keystroke while bar-hosted, only once the edit closes", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    let committedFormula = "=BAR";
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => committedFormula,
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const renderSpy = vi.spyOn(FormulaBarCell.prototype, "renderValue");
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=BAR+1";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));
    textarea.value = "=BAR+12";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));

    expect(renderSpy).not.toHaveBeenCalled();
    expect(placeholderEl(container).textContent).toContain("=BAR");
    expect(placeholderEl(container).textContent).not.toContain("=BAR+12");

    committedFormula = "=BAR+12";
    fireInlineClose();

    expect(renderSpy).toHaveBeenCalled();
    expect(placeholderEl(container).textContent).toContain("=BAR+12");

    renderSpy.mockRestore();
    controller.destroy();
    editor.destroy();
  });

  it("restores the idle view to the pristine formula when a bar-hosted edit is cancelled", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart, fireInlineClose } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=BAR+999";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));

    expect(placeholderEl(container).textContent).not.toContain("999");

    fireInlineClose();

    expect(placeholderEl(container).textContent).toContain("=BAR");
    expect(placeholderEl(container).textContent).not.toContain("999");

    controller.destroy();
    editor.destroy();
  });

  it("refreshes the idle view with the live value when switching from bar back to inline mid-edit", () => {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart, fireSwitchToInline } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: (_address, seed) => {
        fireInlineStart(mount, seed ?? "");

        return true;
      },
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    placeholderEl(container).dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

    textarea.dispatchEvent(new Event("focus"));
    textarea.value = "=BAR+42";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    textarea.dispatchEvent(new Event("input"));

    fireSwitchToInline();

    expect(placeholderEl(container).textContent).toContain("=BAR+42");

    controller.destroy();
    editor.destroy();
  });
});

describe("FormulaBar address box navigation", () => {
  it("shows active cell address in the address box", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({ getActiveCell: activeCellAtOrigin });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireSelection(singleCellSelection({ sheet: "Sheet1", col: 0, row: 1 }));

    expect(addressInput(container).value).toBe("A2");
    controller.destroy();
    editor.destroy();
  });

  it("navigates via the address box within grid bounds", () => {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getGridSize: () => ({ rows: 1000, cols: 100 }),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    const input = addressInput(container);

    input.value = "B3";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(adapter.setActiveCell).toHaveBeenCalledWith({ sheet: "", col: 1, row: 2 });
    controller.destroy();
    editor.destroy();
  });

  it("rejects out-of-bounds address and reverts", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getGridSize: () => ({ rows: 1000, cols: 100 }),
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    fireSelection(singleCellSelection({ sheet: "Sheet1", col: 0, row: 0 }));
    const input = addressInput(container);

    input.value = "ZZ9999";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(input.value).toBe("A1");
    expect(adapter.setActiveCell).not.toHaveBeenCalled();
    controller.destroy();
    editor.destroy();
  });

  it("selects the range and scrolls to its start when a range is committed in the address box", () => {
    const container = document.createElement("div");
    const setSelection = vi.fn();
    const scrollCellIntoView = vi.fn();
    const { adapter } = makeBarAdapter({
      getGridSize: () => ({ rows: 10, cols: 10 }),
      getActiveCell: () => ({ sheet: "Sheet1", col: 0, row: 0 }),
      setSelection,
      scrollCellIntoView,
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });
    const input = addressInput(container);

    input.value = "B2:C4";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(setSelection).toHaveBeenCalledWith({
      start: { sheet: "Sheet1", col: 1, row: 1 },
      end: { sheet: "Sheet1", col: 2, row: 3 },
    });
    expect(scrollCellIntoView).toHaveBeenCalledWith({ sheet: "Sheet1", col: 1, row: 1 });
    controller.destroy();
    editor.destroy();
  });

  it("announces rejected addresses through the provided live region", () => {
    const container = document.createElement("div");
    const { adapter, fireSelection } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getGridSize: () => ({ rows: 1000, cols: 100 }),
    });
    const editor = makeEditor(adapter);
    const liveRegion = { announce: vi.fn(), destroy: vi.fn() } as unknown as LiveRegion;
    const controller = makeFormulaBar(container, {
      adapter,
      editor,
      knownFunctions: new Set(),
      liveRegion,
    });

    fireSelection(singleCellSelection({ sheet: "Sheet1", col: 0, row: 0 }));
    const input = addressInput(container);

    input.value = "ZZZ99999";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(liveRegion.announce).toHaveBeenCalledWith("Invalid cell address: ZZZ99999");
    controller.destroy();
    editor.destroy();
  });

  it("rejects a range outside the grid", () => {
    const container = document.createElement("div");
    const setSelection = vi.fn();
    const { adapter } = makeBarAdapter({
      getGridSize: () => ({ rows: 3, cols: 3 }),
      setSelection,
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });
    const input = addressInput(container);

    input.value = "A1:D4";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(setSelection).not.toHaveBeenCalled();
    controller.destroy();
    editor.destroy();
  });
});

describe("FormulaBar deferred inline-edit start", () => {
  function makeDeferredHarness() {
    const container = document.createElement("div");
    const mount = document.createElement("div");
    const { adapter, fireInlineStart } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => "=BAR",
      beginEdit: () => true,
    });
    const editor = makeEditor(adapter);
    const controller = makeFormulaBar(container, { adapter, editor, knownFunctions: new Set() });

    document.body.append(container, mount);

    return { container, mount, adapter, fireInlineStart, editor, controller };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the editor on a deferred start while focus is still inside the bar", () => {
    const { container, mount, fireInlineStart, editor, controller } = makeDeferredHarness();

    placeholderEl(container).focus();
    fireInlineStart(mount, "=BAR");

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

    expect(overlayEl(container).hidden).toBe(false);
    expect(document.activeElement).toBe(textarea);

    controller.destroy();
    editor.destroy();
  });

  it("cancels a deferred bar-initiated start instead of stealing focus after it left the bar", () => {
    const { container, mount, adapter, fireInlineStart, editor, controller } =
      makeDeferredHarness();
    const outside = document.createElement("button");

    document.body.appendChild(outside);
    placeholderEl(container).focus();
    outside.focus();
    fireInlineStart(mount, "=BAR");

    expect(adapter.cancel).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(outside);
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("cancels a deferred bar-initiated start when focus moved to the address box", () => {
    const { container, mount, adapter, fireInlineStart, editor, controller } =
      makeDeferredHarness();

    placeholderEl(container).focus();
    addressInput(container).focus();
    fireInlineStart(mount, "=BAR");

    expect(adapter.cancel).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(addressInput(container));
    expect(overlayEl(container).hidden).toBe(true);

    controller.destroy();
    editor.destroy();
  });

  it("keeps focusing the editor on grid-initiated inline starts regardless of focus", () => {
    const { mount, adapter, fireInlineStart, editor, controller } = makeDeferredHarness();
    const outside = document.createElement("button");

    document.body.appendChild(outside);
    outside.focus();
    fireInlineStart(mount, "=1+1");

    const textarea = mount.querySelector("textarea") as HTMLTextAreaElement;

    expect(adapter.cancel).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(textarea);

    controller.destroy();
    editor.destroy();
  });
});

class TaxRateHF {
  private names = ["TaxRate"];
  private readonly listeners = new Map<string, Set<(name: string) => void>>();

  private emit(event: string, name: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(name);
    }
  }

  listNamedExpressions(scope?: number) {
    return scope === undefined ? this.names : [];
  }

  getNamedExpressionFormula() {
    return "=0.23";
  }

  simpleCellRangeFromString() {
    return undefined;
  }

  simpleCellAddressFromString() {
    return undefined;
  }

  getSheetName() {
    return "";
  }

  on(event: string, listener: (name: string) => void) {
    const set = this.listeners.get(event) ?? new Set();

    set.add(listener);
    this.listeners.set(event, set);
  }

  off(event: string, listener: (name: string) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  addNamedExpression(name: string) {
    this.names = [...this.names, name];
    this.emit("namedExpressionAdded", name);
  }

  removeNamedExpression(name: string) {
    this.names = this.names.filter((item) => item !== name);
    this.emit("namedExpressionRemoved", name);
  }
}

function refIndexByText(root: Element | null): Record<string, string | null> {
  const marks = root?.querySelectorAll("[data-ref-index]") ?? [];

  return Object.fromEntries(
    Array.from(marks, (mark) => [mark.textContent ?? "", mark.getAttribute("data-ref-index")]),
  );
}

describe("FormulaBar named expressions", () => {
  function makeNamedHarness(engine: TaxRateHF, formula: string) {
    const container = document.createElement("div");
    const { adapter } = makeBarAdapter({
      getActiveCell: activeCellAtOrigin,
      getCellFormula: () => formula,
    });
    const editor = new FormulaEditorImpl(document.createElement("div"), {
      popupCtx: sharedPopupCtx,
      adapter,
      hyperformula: engine as never,
      sheetId: 0,
      onCommit: (value) => adapter.commit(value),
      onCancel: () => adapter.cancel(),
    });
    const controller = makeFormulaBar(container, {
      adapter,
      editor,
      knownFunctions: new Set(["SUM"]),
    });

    return { container, editor, controller };
  }

  it("assigns the idle view the same reference colors as the editor", () => {
    const { container, editor, controller } = makeNamedHarness(
      new TaxRateHF(),
      "=B3*(1+TaxRate)+23+SUM(B2:B3)",
    );

    const idle = refIndexByText(placeholderEl(container));
    const inEditor = refIndexByText(container.querySelector(".hfe-editor"));

    expect(idle.TaxRate).not.toBeUndefined();
    expect(idle).toEqual(inEditor);

    controller.destroy();
    editor.destroy();
  });

  it("recolors the idle view when a named expression is added or removed", () => {
    const engine = new TaxRateHF();
    const { container, editor, controller } = makeNamedHarness(engine, "=Rate+B2");

    expect(refIndexByText(placeholderEl(container)).Rate).toBeUndefined();

    engine.addNamedExpression("Rate");
    expect(refIndexByText(placeholderEl(container)).Rate).toBe("0");
    expect(refIndexByText(placeholderEl(container)).B2).toBe("1");

    engine.removeNamedExpression("Rate");
    expect(refIndexByText(placeholderEl(container)).Rate).toBeUndefined();
    expect(refIndexByText(placeholderEl(container)).B2).toBe("0");

    controller.destroy();
    editor.destroy();
  });
});
