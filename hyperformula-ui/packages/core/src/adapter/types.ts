/**
 * Movement direction for grid navigation and post-commit selection moves.
 *
 * @category Grid Adapter
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * Row/column dimensions of the host grid.
 *
 * @category Grid Adapter
 */
export interface GridSize {
  rows: number;
  cols: number;
}

/**
 * A single cell location. Addresses are HF-space: adapters map any host-specific (visual)
 * indices before handing an address to core.
 *
 * @category Grid Adapter
 */
export interface CellAddress {
  sheet: string;
  col: number;
  row: number;
}

/**
 * A rectangular cell range between two corner addresses.
 *
 * @category Grid Adapter
 */
export interface CellRange {
  start: CellAddress;
  end: CellAddress;
}

/**
 * The host grid's current selection: the active cell plus the full selected range.
 *
 * @category Grid Adapter
 */
export interface GridSelection {
  active: CellAddress;
  range: CellRange;
}

/**
 * Teardown function returned by every subscription method; call it to remove the listener.
 *
 * @category Grid Adapter
 */
export type Unsubscribe = () => void;

/**
 * Resolves the highlight color a picked range will receive, so in-drag preview highlights
 * match the color the editor assigns once the ref is inserted. `wholeAxis` marks header
 * picks that span an entire column or row.
 *
 * @category Grid Adapter
 */
export type RefSelectionColorResolver = (
  range: CellRange,
  append: boolean,
  wholeAxis?: HeaderAxis,
) => string;

/**
 * One persistent range highlight. `fill` paints the range background; `whole` stretches the
 * highlight across the entire column or row.
 *
 * @category Grid Adapter
 */
export interface RangeHighlight {
  range: CellRange;
  color: string;
  fill?: boolean;
  whole?: "column" | "row";
}

/**
 * A single-cell pick made during ref-selection. `append` is `true` when the gesture adds
 * another ref (joined with the argument separator) instead of replacing the pending one.
 *
 * @category Grid Adapter
 */
export interface CellPick {
  ref: CellAddress;
  append: boolean;
}

/**
 * A range pick made during ref-selection; `append` follows the {@link CellPick} contract.
 *
 * @category Grid Adapter
 */
export interface RangePick {
  ref: CellRange;
  append: boolean;
}

/**
 * The header axis a whole-row/column pick spans.
 *
 * @category Grid Adapter
 */
export type HeaderAxis = "column" | "row";

/**
 * A whole-row/column pick made by clicking or dragging grid headers during ref-selection;
 * `start`/`end` are inclusive indices on `axis` and `append` follows the {@link CellPick}
 * contract.
 *
 * @category Grid Adapter
 */
export interface HeaderPick {
  axis: HeaderAxis;
  sheet: string;
  start: number;
  end: number;
  append: boolean;
}

/**
 * Receives {@link CellPick} events from the adapter.
 *
 * @category Grid Adapter
 */
export type CellPickListener = (pick: CellPick) => void;

/**
 * Receives {@link RangePick} events from the adapter.
 *
 * @category Grid Adapter
 */
export type RangePickListener = (pick: RangePick) => void;

/**
 * Receives {@link HeaderPick} events from the adapter.
 *
 * @category Grid Adapter
 */
export type HeaderPickListener = (pick: HeaderPick) => void;

/**
 * Receives the clicked cell when a grid click lands outside the editor while ref-selection
 * is inactive.
 *
 * @category Grid Adapter
 */
export type OutsideCellClickListener = (address: CellAddress) => void;

/**
 * Declares which side commits when a grid cell is clicked while the editor is open and
 * ref-selection is inactive: `"emitted"` adapters fire `onOutsideCellClick` and core commits;
 * `"native"` adapters never emit — the host's own editor manager commits.
 *
 * @category Grid Adapter
 */
export type OutsideClickCommitMode = "emitted" | "native";

/**
 * Coordinate lookup, ref formatting, highlights, and pick events — the adapter role consumed
 * by `FormulaEditor` and its highlight handling.
 *
 * @category Grid Adapter
 */
export interface GridPickSurface {
  /** See {@link OutsideClickCommitMode} for how this capability routes outside-click commits. */
  readonly outsideClickCommitMode: OutsideClickCommitMode;

  /** Returns the cell under viewport coordinates, or `null` when none is there. */
  getCellAddressAt(x: number, y: number): CellAddress | null;

  /** Formats an address or range in the host's reference syntax (e.g. `A1`, `A1:B5`). */
  formatRef(ref: CellAddress | CellRange): string;

  /** Replaces the full set of persistent ref highlights. */
  setHighlights(items: RangeHighlight[]): void;

  /** Draws the ephemeral (in-drag preview) highlight for `range` in `color`. */
  highlightRange(range: CellRange, color: string): void;

  /** Clears the ephemeral highlight drawn by `highlightRange`. */
  clearEphemeralHighlight(): void;

  /** Clears every persistent highlight set via `setHighlights`. */
  clearHighlights(): void;

  /**
   * Applies the consumer's theming class to the adapter's overlay elements; `null` clears it.
   * Driven by `FormulaBuilder`'s `className` option.
   */
  setOverlayClassName(className: string | null): void;

  /** Subscribes to single-cell picks made during ref-selection. */
  onCellPick(callback: CellPickListener): Unsubscribe;

  /** Subscribes to range picks made during ref-selection. */
  onRangePick(callback: RangePickListener): Unsubscribe;

  /**
   * Subscribes to grid clicks outside the editor while ref-selection is inactive. Only
   * `"emitted"` adapters fire this; see {@link OutsideClickCommitMode}.
   */
  onOutsideCellClick(callback: OutsideCellClickListener): Unsubscribe;

  /**
   * Enters ref-selection mode: grid clicks and drags become ref picks instead of edits.
   * `resolveColor` supplies preview-highlight colors; `isPickEligible` gates whether a
   * gesture may produce a pick.
   */
  enterRefSelectionMode(
    resolveColor?: RefSelectionColorResolver,
    isPickEligible?: () => boolean,
  ): void;

  /** Leaves ref-selection mode and restores normal grid interaction. */
  exitRefSelectionMode(): void;
}

/**
 * Optional adapter role for whole-row/column header picking during ref-selection. Adapters
 * whose host grid exposes clickable headers implement it; core feature-detects via
 * `onHeaderPick` presence.
 *
 * @category Grid Adapter
 */
export interface GridHeaderPickSurface {
  /** Subscribes to whole-row/column header picks made during ref-selection. */
  onHeaderPick(callback: HeaderPickListener): Unsubscribe;
}

/**
 * Keyboard point-mode navigation — the adapter role consumed by the editor's point-mode
 * controller. Move/jump implementations scroll the viewport so the point-mode cursor stays
 * visible; the anchor comes from {@link GridEditLifecycle.getActiveCell}.
 *
 * @category Grid Adapter
 */
export interface GridNavigation {
  /** Returns the host grid's dimensions. */
  getGridSize(): GridSize;

  /** Ctrl+arrow-style jump: returns the edge of the contiguous data block from `from`. */
  getDataEdge(from: CellAddress, direction: Direction): CellAddress;

  /** Single-step move from `from`, clamped to the grid bounds. */
  stepCell(from: CellAddress, direction: Direction): CellAddress;

  /** Scrolls the host viewport so `address` is visible. */
  scrollCellIntoView(address: CellAddress): void;
}

/**
 * The bar/edit lifecycle — the adapter role consumed by `FormulaBar` and the barless
 * inline-edit subscription. Brokers the single shared editor's handoff between the inline
 * cell mount and the formula bar.
 *
 * @category Grid Adapter
 */
export interface GridEditLifecycle {
  /**
   * Returns the active cell, or `null` when there is none.
   *
   * Addresses are HF-space. Core handles the `null` path by calling
   * {@link GridEditLifecycle.selectFirstCell}, so adapters may return `null` safely.
   */
  getActiveCell(): CellAddress | null;

  /** Fires `GridSelection | null` whenever the host selection changes. */
  onSelectionChange(callback: (selection: GridSelection | null) => void): Unsubscribe;

  /** Returns the stored formula/value text of `address`, used to seed the bar. */
  getCellFormula(address: CellAddress): string;

  /**
   * Starts an edit on `address`, optionally seeded with `seed`.
   *
   * @returns `true` if an edit was initiated — synchronously OR async-pending (an adapter
   * whose editor opens on a later tick must still return `true`); `false` if it bailed
   * (read-only, unmapped, or not-rendered cell).
   */
  beginEdit(address: CellAddress, seed?: string): boolean;

  /**
   * Called when `getActiveCell()` returns `null`; adapters whose host always has a selection
   * may implement this as a no-op.
   */
  selectFirstCell(): void;

  /**
   * Selects `address` without starting an edit, via the same path as `selectFirstCell`.
   * Returns `false` when the host could not select it (a filtered-out row, a hidden column);
   * the address box then rejects the typed address. Returning nothing counts as success.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: adapters written before the boolean result return void
  setActiveCell(address: CellAddress): boolean | void;

  /**
   * Selects the given range. Selection gestures (mouse drag, shift+click, shift+arrows) are
   * host-owned — core and adapters carry the data contract only. Returns `false` when the host
   * could not select the range; returning nothing counts as success.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: adapters written before the boolean result return void
  setSelection(range: CellRange): boolean | void;

  /**
   * Fires when a cell editor opens. `mount` is the overlay element the shared editor attaches
   * into; `seed` is the type-to-edit text the edit began with (`""` when opened without one).
   */
  onInlineEditStart(callback: (mount: HTMLElement, seed: string) => void): Unsubscribe;

  /** Fires when the cell editor closes. */
  onInlineEditClose(callback: () => void): Unsubscribe;

  /** Fires when the bar hands editing back to the inline cell. */
  onSwitchToInline(callback: () => void): Unsubscribe;

  /**
   * Commits `value` to the active cell; the optional `direction` drives the host's
   * post-commit selection move (Enter → down, Tab → right, …).
   */
  commit(value: string, direction?: Direction): void;

  /** Cancels the current edit without committing. */
  cancel(): void;

  /** Hides or shows the cell overlay mount while the editor is hosted in the bar. */
  setInlineEditorVisible(visible: boolean): void;
}

/**
 * The contract between the engine-agnostic editor core and a host grid.
 *
 * Composed of three role interfaces mirroring the three core consumers:
 * {@link GridPickSurface} (FormulaEditor + HighlightController), {@link GridNavigation}
 * (PointModeController), and {@link GridEditLifecycle} (FormulaBar and the barless
 * inline-edit subscription) — plus the optional {@link GridHeaderPickSurface}.
 * `destroy()` is host-owned — core never calls it.
 *
 * @category Grid Adapter
 * @example
 * ```ts
 * class MyGridAdapter extends NullAdapter {
 *   getActiveCell() {
 *     return this.grid.selection ?? null;
 *   }
 * }
 *
 * const builder = new FormulaBuilder({ rootEl: gridRoot, adapter: new MyGridAdapter() });
 * ```
 */
export interface IGridAdapter
  extends GridPickSurface,
    GridNavigation,
    GridEditLifecycle,
    Partial<GridHeaderPickSurface> {
  destroy(): void;
}

/**
 * The narrow adapter slice a standalone `FormulaEditor` consumes — pick surface, navigation,
 * and `getActiveCell` only. `FormulaEditorOptions.adapter` is typed against this;
 * `FormulaBuilder` and `FormulaBar` take the full {@link IGridAdapter}.
 *
 * @category Grid Adapter
 */
export type EditorGridAdapter = GridPickSurface &
  GridNavigation &
  Pick<GridEditLifecycle, "getActiveCell"> &
  Partial<GridHeaderPickSurface>;

/**
 * A pixel rectangle relative to the overlay host, used to draw range highlights.
 *
 * @category Grid Adapter
 */
export interface RangeRect {
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex?: number;
}

/**
 * Geometry provider consumed by `HighlightLayer`: where to mount, which pixel rects a range
 * occupies, the optional viewport clip, and viewport-change notifications. Header-element
 * lookups are optional and enable header highlights when the host exposes them.
 *
 * @category Grid Adapter
 */
export interface GridGeometry {
  getOverlayHost(): HTMLElement;
  getRangeRects(range: CellRange): RangeRect[];
  getViewportClip?(): RangeRect | null;
  onViewportChange(callback: () => void): Unsubscribe;
  getColHeaderEl?(col: number): HTMLElement | null;
  getRowHeaderEl?(row: number): HTMLElement | null;
}
