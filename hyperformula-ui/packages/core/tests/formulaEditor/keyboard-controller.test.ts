import { afterEach, describe, expect, it, vi } from "vitest";
import type { CellAddress, CellRange, Direction } from "../../src/adapter/types";
import type { HyperFormulaLike } from "../../src/engine/types";
import { CN } from "../../src/theme/classNames";
import {
  createEditorHarness,
  formatRefAsRC,
  press,
  requireTextarea,
  sel,
  TestGridAdapter,
  typeInto,
} from "../helpers";

interface KeyboardHarnessOptions {
  onCommit?: (value: string, direction?: Direction) => void;
  onCommitFill?: (value: string) => void;
  onCancel?: () => void;
  hyperformula?: HyperFormulaLike;
}

function formatRefAsA1(ref: CellAddress | CellRange): string {
  const a1 = (cell: CellAddress) => `${String.fromCharCode(65 + cell.col)}${cell.row + 1}`;

  return "start" in ref ? `${a1(ref.start)}:${a1(ref.end)}` : a1(ref);
}

function createKeyboardHarness(options: KeyboardHarnessOptions = {}) {
  const adapter = new TestGridAdapter({
    formatRef: formatRefAsRC,
    active: { sheet: "", col: 0, row: 0 },
  });

  return createEditorHarness({ adapter, ...options });
}

function dispatchKeydown(
  host: HTMLElement,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });

  requireTextarea(host).dispatchEvent(event);

  return event;
}

class CatalogHF {
  getRegisteredFunctionNames(): string[] {
    return ["SUM", "SUMIF"];
  }

  getConfig(): { language: string } {
    return { language: "keyboardControllerCatalog" };
  }
}

function createSuggestionHarness(options: KeyboardHarnessOptions = {}) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(10, 10, 100, 20),
  );

  return createKeyboardHarness({ ...options, hyperformula: new CatalogHF() as never });
}

function activeSuggestionText(portal: HTMLElement): string {
  const activeItem = portal.querySelector(sel(CN.suggestionsItemActive));

  if (!activeItem) {
    throw new Error("expected an active suggestion item");
  }

  return activeItem.textContent ?? "";
}

function requireSuggestionsRoot(portal: HTMLElement): HTMLElement {
  const root = portal.querySelector<HTMLElement>(sel(CN.suggestions));

  if (!root) {
    throw new Error("expected the suggestions popup root in the portal");
  }

  return root;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("commit keys", () => {
  it("maps Enter, Shift+Enter, Tab and Shift+Tab to commit directions", () => {
    const directions: Array<Direction | undefined> = [];
    const { host, destroy } = createKeyboardHarness({
      onCommit: (_value, direction) => directions.push(direction),
    });

    typeInto(host, "=1");
    press(host, "Enter");
    press(host, "Enter", { shiftKey: true });
    press(host, "Tab");
    press(host, "Tab", { shiftKey: true });

    expect(directions).toEqual(["down", "up", "right", "left"]);
    destroy();
  });

  it("prevents the default action when Enter commits", () => {
    const { host, destroy } = createKeyboardHarness({ onCommit: () => {} });

    typeInto(host, "=1");
    const event = dispatchKeydown(host, "Enter");

    expect(event.defaultPrevented).toBe(true);
    destroy();
  });

  it("closes unbalanced parentheses before committing a formula", () => {
    const committed: string[] = [];
    const { host, destroy } = createKeyboardHarness({
      onCommit: (value) => committed.push(value),
    });

    typeInto(host, "=IF(1,SUM(2");
    press(host, "Enter");

    expect(committed).toEqual(["=IF(1,SUM(2))"]);
    destroy();
  });

  it("commits non-formula text unchanged even with an open parenthesis", () => {
    const committed: string[] = [];
    const { host, destroy } = createKeyboardHarness({
      onCommit: (value) => committed.push(value),
    });

    typeInto(host, "hello(");
    press(host, "Enter");

    expect(committed).toEqual(["hello("]);
    destroy();
  });
});

describe("clean-editor tab slide", () => {
  it("falls through on Tab when bar-hosted and clean, leaving the default action untouched", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit });

    editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "bar",
      isDirty: () => false,
      focusHost: () => {},
    });

    const event = dispatchKeydown(host, "Tab");

    expect(onCommit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    destroy();
  });

  it("still commits on Tab when bar-hosted but dirty", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit });

    editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "bar",
      isDirty: () => true,
      focusHost: () => {},
    });

    const event = dispatchKeydown(host, "Tab");

    expect(onCommit).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    destroy();
  });

  it("still commits on Tab when inline-hosted, even if clean", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit });

    editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "inline",
      isDirty: () => false,
      focusHost: () => {},
    });

    const event = dispatchKeydown(host, "Tab");

    expect(onCommit).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    destroy();
  });

  it("does not affect Enter commits while bar-hosted and clean", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit });

    editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "bar",
      isDirty: () => false,
      focusHost: () => {},
    });

    const event = dispatchKeydown(host, "Enter");

    expect(onCommit).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    destroy();
  });
});

describe("newline insertion", () => {
  it("Ctrl+Enter inserts a newline at the caret instead of committing", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit });

    typeInto(host, "=1");
    press(host, "Enter", { ctrlKey: true });

    expect(editor.getValue()).toBe("=1\n");
    expect(requireTextarea(host).selectionStart).toBe(3);
    expect(onCommit).not.toHaveBeenCalled();
    destroy();
  });

  it("Alt+Enter inserts a newline at the caret", () => {
    const onCommitFill = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommitFill });

    typeInto(host, "=1");
    press(host, "Enter", { altKey: true });

    expect(editor.getValue()).toBe("=1\n");
    expect(onCommitFill).not.toHaveBeenCalled();
    destroy();
  });
});

describe("fill commit", () => {
  it.each([
    ["Ctrl+Enter", { ctrlKey: true }],
    ["Cmd+Enter", { metaKey: true }],
  ])("%s commits the value to every selected cell when the host supports it", (_name, init) => {
    const onCommit = vi.fn();
    const onCommitFill = vi.fn();
    const { host, editor, destroy } = createKeyboardHarness({ onCommit, onCommitFill });

    typeInto(host, "=SUM(A1");
    press(host, "Enter", init);

    expect(onCommitFill).toHaveBeenCalledWith("=SUM(A1)");
    expect(onCommit).not.toHaveBeenCalled();
    expect(editor.getValue()).toBe("=SUM(A1)");
    destroy();
  });
});

describe("escape", () => {
  it("Escape cancels the edit immediately when no point selection is pending", () => {
    const onCancel = vi.fn();
    const { host, destroy } = createKeyboardHarness({ onCancel });

    typeInto(host, "=1+2");
    const event = dispatchKeydown(host, "Escape");

    expect(onCancel).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    destroy();
  });

  it("Escape stays unhandled without an onCancel handler", () => {
    const { host, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    const event = dispatchKeydown(host, "Escape");

    expect(event.defaultPrevented).toBe(false);
    destroy();
  });
});

describe("range selection arrows", () => {
  it("arrow keys fall back to caret movement when the caret does not follow a ref opener", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    const event = dispatchKeydown(host, "ArrowLeft");

    expect(event.defaultPrevented).toBe(false);
    expect(editor.getValue()).toBe("=1+2");
    destroy();
  });

  it("arrow fallback latches range selection off for later eligible caret positions", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    press(host, "ArrowLeft");
    const textarea = requireTextarea(host);

    textarea.selectionStart = 3;
    textarea.selectionEnd = 3;
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=1+2");
    destroy();
  });

  it("typing re-arms automatic range selection after the latch", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    press(host, "ArrowLeft");
    typeInto(host, "=1+");
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=1+R0C1");
    destroy();
  });

  it("Ctrl+E force-arms range selection where auto mode would not point", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    press(host, "e", { ctrlKey: true });
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=1+2R0C1");
    destroy();
  });

  it("Shift+Arrow extends the pending ref into a normalized range", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=");
    press(host, "ArrowRight");
    press(host, "ArrowRight", { shiftKey: true });

    expect(editor.getValue()).toBe("=R0C1:R0C2");
    destroy();
  });

  it("Ctrl+Arrow jumps the point cursor to the data edge", () => {
    class EdgeAdapter extends TestGridAdapter {
      override getDataEdge(from: CellAddress): CellAddress {
        return { sheet: from.sheet, row: from.row, col: 7 };
      }
    }

    const adapter = new EdgeAdapter({
      formatRef: formatRefAsRC,
      active: { sheet: "", col: 0, row: 0 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=");
    press(host, "ArrowRight", { ctrlKey: true });

    expect(editor.getValue()).toBe("=R0C7");
    destroy();
  });

  it("Ctrl+Shift+Arrow extends the pending ref to the data edge", () => {
    class EdgeAdapter extends TestGridAdapter {
      override getDataEdge(from: CellAddress): CellAddress {
        return { sheet: from.sheet, row: from.row, col: 7 };
      }
    }

    const adapter = new EdgeAdapter({
      formatRef: formatRefAsRC,
      active: { sheet: "", col: 0, row: 0 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=");
    press(host, "ArrowRight");
    press(host, "ArrowRight", { ctrlKey: true, shiftKey: true });

    expect(editor.getValue()).toBe("=R0C1:R0C7");
    destroy();
  });
});

describe("F4 reference cycling", () => {
  it("cycles the cell reference under the caret through absolute variants", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=A1");
    const seen: string[] = [];

    for (let i = 0; i < 4; i++) {
      press(host, "F4");
      seen.push(editor.getValue());
    }

    expect(seen).toEqual(["=$A$1", "=A$1", "=$A1", "=A1"]);
    destroy();
  });

  it("keeps point mode eligible after cycling so F2 disarms instead of appending a ref", () => {
    const adapter = new TestGridAdapter({
      formatRef: formatRefAsA1,
      active: { sheet: "", col: 0, row: 0 },
    });
    const { host, editor, destroy } = createEditorHarness({ adapter });

    typeInto(host, "=");
    press(host, "ArrowRight");
    press(host, "F4");
    press(host, "F2");
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=$B$1");
    destroy();
  });
});

describe("parentheses", () => {
  it("auto-closes a typed ( and places the caret inside", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=SUM");
    const event = dispatchKeydown(host, "(");

    expect(event.defaultPrevented).toBe(true);
    expect(editor.getValue()).toBe("=SUM()");
    expect(requireTextarea(host).selectionStart).toBe(5);
    destroy();
  });

  it("wraps the current selection in parentheses", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=1+2");
    const textarea = requireTextarea(host);

    textarea.selectionStart = 1;
    textarea.selectionEnd = 4;
    press(host, "(");

    expect(editor.getValue()).toBe("=(1+2)");
    expect(textarea.selectionStart).toBe(6);
    destroy();
  });

  it("leaves ( unhandled outside formula context", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "abc");
    const event = dispatchKeydown(host, "(");

    expect(event.defaultPrevented).toBe(false);
    expect(editor.getValue()).toBe("abc");
    destroy();
  });

  it("leaves ) to default insertion when the next character is not )", () => {
    const { host, editor, destroy } = createKeyboardHarness();

    typeInto(host, "=SUM(1");
    const event = dispatchKeydown(host, ")");

    expect(event.defaultPrevented).toBe(false);
    expect(editor.getValue()).toBe("=SUM(1");
    destroy();
  });
});

describe("paren keys typed with physical shift", () => {
  it("auto-closes '(' when the event carries shiftKey (Shift+9)", () => {
    const { host, destroy } = createKeyboardHarness();

    typeInto(host, "=SUM");
    press(host, "(", { shiftKey: true });

    expect(requireTextarea(host).value).toBe("=SUM()");
    destroy();
  });
});

describe("suggestion popup keys", () => {
  it("typing a function prefix opens suggestions with the first item active", () => {
    const { host, popupCtx, destroy } = createSuggestionHarness();

    typeInto(host, "=SU");

    expect(requireSuggestionsRoot(popupCtx.portal).hidden).toBe(false);
    expect(activeSuggestionText(popupCtx.portal)).toBe("SUM");
    destroy();
  });

  it("ArrowDown moves the active suggestion instead of pointing", () => {
    const { host, popupCtx, editor, destroy } = createSuggestionHarness();

    typeInto(host, "=SU");
    press(host, "ArrowDown");

    expect(activeSuggestionText(popupCtx.portal)).toBe("SUMIF");
    expect(editor.getValue()).toBe("=SU");
    destroy();
  });

  it("Enter accepts the active suggestion instead of committing", () => {
    const onCommit = vi.fn();
    const { host, popupCtx, editor, destroy } = createSuggestionHarness({ onCommit });

    typeInto(host, "=SU");
    press(host, "Enter");

    expect(editor.getValue()).toBe("=SUM()");
    expect(requireTextarea(host).selectionStart).toBe(5);
    expect(requireSuggestionsRoot(popupCtx.portal).hidden).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
    destroy();
  });

  it("Tab accepts the active suggestion instead of committing", () => {
    const onCommit = vi.fn();
    const { host, editor, destroy } = createSuggestionHarness({ onCommit });

    typeInto(host, "=SU");
    press(host, "Tab");

    expect(editor.getValue()).toBe("=SUM()");
    expect(onCommit).not.toHaveBeenCalled();
    destroy();
  });

  it("Escape closes suggestions first and cancels the edit only on the second press", () => {
    const onCancel = vi.fn();
    const { host, popupCtx, editor, destroy } = createSuggestionHarness({ onCancel });

    typeInto(host, "=SU");
    press(host, "Escape");

    expect(requireSuggestionsRoot(popupCtx.portal).hidden).toBe(true);
    expect(editor.getValue()).toBe("=SU");
    expect(onCancel).not.toHaveBeenCalled();

    press(host, "Escape");

    expect(onCancel).toHaveBeenCalledOnce();
    destroy();
  });
});
