import { vi } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import type { GridSelection, IGridAdapter } from "../../src/adapter/types";

export interface BarAdapterHarness {
  adapter: IGridAdapter;
  fireSelection: (selection: GridSelection | null) => void;
  fireInlineStart: (mount: HTMLElement, seed: string) => void;
  fireInlineClose: () => void;
  fireSwitchToInline: () => void;
}

export function makeBarAdapter(overrides: Partial<IGridAdapter> = {}): BarAdapterHarness {
  let selectionListener: ((selection: GridSelection | null) => void) | null = null;
  let inlineStartListener: ((mount: HTMLElement, seed: string) => void) | null = null;
  let inlineCloseListener: (() => void) | null = null;
  let switchToInlineListener: (() => void) | null = null;

  const nullAdapter = new NullAdapter();

  const adapter: IGridAdapter = {
    outsideClickCommitMode: "emitted",
    getCellAddressAt: (x, y) => nullAdapter.getCellAddressAt(x, y),
    formatRef: (ref) => nullAdapter.formatRef(ref),
    setHighlights: (items) => nullAdapter.setHighlights(items),
    highlightRange: (range, color) => nullAdapter.highlightRange(range, color),
    clearEphemeralHighlight: () => nullAdapter.clearEphemeralHighlight(),
    clearHighlights: () => nullAdapter.clearHighlights(),
    onCellPick: (callback) => nullAdapter.onCellPick(callback),
    onRangePick: (callback) => nullAdapter.onRangePick(callback),
    onOutsideCellClick: (callback) => nullAdapter.onOutsideCellClick(callback),
    enterRefSelectionMode: () => nullAdapter.enterRefSelectionMode(),
    exitRefSelectionMode: () => nullAdapter.exitRefSelectionMode(),
    getGridSize: () => nullAdapter.getGridSize(),
    getDataEdge: (from, direction) => nullAdapter.getDataEdge(from, direction),
    stepCell: (from, direction) => nullAdapter.stepCell(from, direction),
    scrollCellIntoView: (address) => nullAdapter.scrollCellIntoView(address),
    destroy: () => nullAdapter.destroy(),
    getActiveCell: () => null,
    onSelectionChange: (callback) => {
      selectionListener = callback;

      return () => {
        selectionListener = null;
      };
    },
    getCellFormula: () => "",
    beginEdit: vi.fn(),
    selectFirstCell: vi.fn(),
    setActiveCell: vi.fn(),
    setSelection: vi.fn(),
    onInlineEditStart: (callback) => {
      inlineStartListener = callback;

      return () => {
        inlineStartListener = null;
      };
    },
    onInlineEditClose: (callback) => {
      inlineCloseListener = callback;

      return () => {
        inlineCloseListener = null;
      };
    },
    onSwitchToInline: (callback) => {
      switchToInlineListener = callback;

      return () => {
        switchToInlineListener = null;
      };
    },
    commit: vi.fn(),
    cancel: vi.fn(),
    setInlineEditorVisible: vi.fn(),
    setOverlayClassName: (className) => nullAdapter.setOverlayClassName(className),
    ...overrides,
  };

  return {
    adapter,
    fireSelection: (selection: GridSelection | null) => selectionListener?.(selection),
    fireInlineStart: (mount: HTMLElement, seed: string) => inlineStartListener?.(mount, seed),
    fireInlineClose: () => inlineCloseListener?.(),
    fireSwitchToInline: () => switchToInlineListener?.(),
  };
}
