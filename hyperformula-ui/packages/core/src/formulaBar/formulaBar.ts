import { singleCellSelection } from "../adapter/range";
import type { GridSelection, IGridAdapter } from "../adapter/types";
import { EventManager } from "../events/eventManager";
import type { Disposable } from "../events/types";
import type { FormulaEditor } from "../formulaEditor/formulaEditor";
import { CN } from "../theme/classNames";
import type { LiveRegion } from "../ui/liveRegion";
import type { LayoutDirection } from "../ui/popup/types";
import type { IconsOptions } from "../ui/types";
import type { AddressBoxRange, AddressBoxTarget } from "./formulaBarAddressBox";
import { FormulaBarAddressBox } from "./formulaBarAddressBox";
import { FormulaBarCell } from "./formulaBarCell";

/**
 * Options for {@link FormulaBar}.
 *
 * @category Formula Bar
 */
export interface FormulaBarOptions {
  /** Full host adapter — the bar drives the bar-lifecycle methods on it. */
  adapter: IGridAdapter;

  /** The pre-built shared editor owned by `FormulaBuilder` — the bar never constructs one. */
  editor: FormulaEditor;

  /** Function names used to color the idle formula view. */
  knownFunctions: ReadonlySet<string>;
  /** Screen-reader announcer used to speak invalid address-box input. */
  liveRegion: LiveRegion;

  /** Theming class added to the bar container; removed on `destroy()`. */
  className?: string;

  /**
   * Layout direction of the bar.
   *
   * @defaultValue `"ltr"`
   */
  direction?: LayoutDirection;

  /** Host factories replacing the built-in icons; the bar renders the `function` icon. */
  icons?: IconsOptions;
}

function asDisposable(unsub: () => void): Disposable {
  return { dispose: unsub };
}

/**
 * Excel-style formula bar composing {@link FormulaBarAddressBox} and {@link FormulaBarCell}.
 * Receives the shared `FormulaEditor` from `FormulaBuilder` and drives it between bar and
 * inline cell via the `IGridAdapter` bar-lifecycle methods. The recommended path is
 * `FormulaBuilder`'s `formulaBarContainer` option / `attachFormulaBar` — not manual
 * construction.
 *
 * @category Formula Bar
 * @example
 * ```ts
 * const builder = new FormulaBuilder({ rootEl: gridRoot, adapter, formulaBarContainer: barEl });
 * ```
 */
export class FormulaBar {
  private readonly adapter: IGridAdapter;
  private readonly editor: FormulaEditor;
  private readonly events = new EventManager();
  private editing = false;
  private barInitiated = false;
  private barInitiatedWithFocus = false;
  private pristineValue = "";
  private inlineMount: HTMLElement | null = null;
  private readonly container: HTMLElement;
  private readonly addressBox: FormulaBarAddressBox;
  private readonly formulaCell: FormulaBarCell;
  private readonly sharedClassName: string | undefined;
  private readonly stopKeyPropagation = (): void => {};
  private readonly stopMouseDownPropagation = (): void => {};

  constructor(container: HTMLElement, options: FormulaBarOptions) {
    this.adapter = options.adapter;
    this.editor = options.editor;
    this.container = container;
    this.sharedClassName = options.className;
    this.container.classList.add(CN.formulaBar);

    if (options.direction === "rtl") {
      this.container.setAttribute("dir", "rtl");
    }

    if (this.sharedClassName !== undefined) {
      this.container.classList.add(this.sharedClassName);
    }

    this.addressBox = new FormulaBarAddressBox({
      onNavigate: (target) => this.navigateTo(target),
      onNavigateRange: (range) => this.navigateToRange(range),
      onInvalidInput: (text) => options.liveRegion.announce(`Invalid cell address: ${text}`),
    });
    this.formulaCell = new FormulaBarCell({
      knownFunctions: options.knownFunctions,
      separators: options.editor.engine.getSeparators(),
      onActivate: () => this.activateFromIdle(),
      ...(options.icons !== undefined && { icons: options.icons }),
    });
    this.container.append(this.addressBox.root, this.formulaCell.root);
    this.editor.attachTo(this.formulaCell.overlayMount);

    const guardScope = this.events.createScope("editor-guard", {
      stopPropagation: true,
    });

    guardScope.listen(this.formulaCell.overlayMount, "mousedown", this.stopMouseDownPropagation);
    guardScope.listen(this.container, "keydown", this.stopKeyPropagation);
    guardScope.listen(this.container, "keyup", this.stopKeyPropagation);
    guardScope.listen(this.container, "keypress", this.stopKeyPropagation);
    guardScope.activate();

    const subsScope = this.events.createScope("subscriptions");

    subsScope.add(
      asDisposable(
        this.adapter.onSelectionChange((selection) => {
          if (this.editing) {
            return;
          }

          this.adapter.setHighlights([]);
          this.syncSelection(selection);
        }),
      ),
    );

    subsScope.add(
      asDisposable(
        this.editor.on("change", () => {
          if (this.editing && this.formulaCell.overlayMount.hidden) {
            this.formulaCell.renderValue(this.editor.getValue());
          }
        }),
      ),
    );

    subsScope.add(
      asDisposable(
        this.editor.on("focus", (payload) => {
          if (payload.focused && !this.editing) {
            if (!this.adapter.getActiveCell()) {
              this.adapter.selectFirstCell();
            }
          }
        }),
      ),
    );

    subsScope.add(
      asDisposable(
        this.adapter.onInlineEditStart((mount, seed) => this.handleInlineEditStart(mount, seed)),
      ),
    );
    subsScope.add(asDisposable(this.adapter.onInlineEditClose(() => this.handleInlineEditClose())));
    subsScope.add(asDisposable(this.adapter.onSwitchToInline(() => this.switchToInline())));

    this.editor.setHostToggleDelegate({
      isAvailable: () => this.editing && this.inlineMount !== null,
      currentHost: () => (this.formulaCell.overlayMount.hidden ? "inline" : "bar"),
      isDirty: () => this.editor.getValue() !== this.pristineValue,
      focusHost: (host) => {
        if (host === "bar") {
          this.switchToBar();
        } else {
          this.switchToInline();
        }
      },
    });

    const active = this.adapter.getActiveCell();

    if (active) {
      this.syncSelection(singleCellSelection(active));
    }
  }

  private navigateTo(target: AddressBoxTarget): boolean {
    const { rows, cols } = this.adapter.getGridSize();

    if (target.row < 0 || target.row >= rows || target.col < 0 || target.col >= cols) {
      return false;
    }

    const sheet = this.adapter.getActiveCell()?.sheet ?? "";
    const address = { sheet, col: target.col, row: target.row };

    this.adapter.setActiveCell(address);
    this.adapter.scrollCellIntoView(address);

    return true;
  }

  private navigateToRange(range: AddressBoxRange): boolean {
    const { rows, cols } = this.adapter.getGridSize();

    if (
      range.start.row < 0 ||
      range.start.col < 0 ||
      range.end.row >= rows ||
      range.end.col >= cols
    ) {
      return false;
    }

    const sheet = this.adapter.getActiveCell()?.sheet ?? "";
    const cellRange = {
      start: { sheet, col: range.start.col, row: range.start.row },
      end: { sheet, col: range.end.col, row: range.end.row },
    };

    this.adapter.setSelection(cellRange);
    this.adapter.scrollCellIntoView(cellRange.start);

    return true;
  }

  private activateFromIdle(): void {
    if (this.editing) {
      this.switchToBar();

      return;
    }

    let address = this.adapter.getActiveCell();

    if (!address) {
      this.adapter.selectFirstCell();
      address = this.adapter.getActiveCell();
    }

    if (!address) {
      return;
    }

    const formula = this.adapter.getCellFormula(address);

    this.editing = true;
    this.barInitiated = true;
    this.barInitiatedWithFocus = this.formulaCell.root.contains(document.activeElement);
    this.pristineValue = this.editor.normalizeFormula(formula);

    const started = this.adapter.beginEdit(address, formula);

    if (!started) {
      this.editing = false;
      this.barInitiated = false;
      this.barInitiatedWithFocus = false;
    }
  }

  private syncSelection(selection: GridSelection | null): void {
    const formula = selection ? this.adapter.getCellFormula(selection.active) : "";
    this.editor.setValue(formula, { silentHighlights: true });
    this.formulaCell.renderValue(formula);
    this.addressBox.setSelection(selection);
  }

  private handleInlineEditStart(mount: HTMLElement, seed: string): void {
    if (
      this.barInitiated &&
      this.barInitiatedWithFocus &&
      !this.formulaCell.root.contains(document.activeElement)
    ) {
      this.editing = false;
      this.barInitiated = false;
      this.barInitiatedWithFocus = false;
      this.adapter.cancel();

      return;
    }

    if (!this.barInitiated) {
      const address = this.adapter.getActiveCell();
      const formula = address ? this.adapter.getCellFormula(address) : seed;
      this.pristineValue = this.editor.normalizeFormula(formula);
    }

    this.editing = true;
    this.inlineMount = mount;
    this.editor.setValue(seed);
    this.editor.enterRefSelectionMode();

    if (this.barInitiated) {
      this.formulaCell.setOverlayVisible(true);
      this.editor.attachTo(this.formulaCell.overlayMount);
      this.adapter.setInlineEditorVisible(false);
    } else {
      this.editor.attachTo(mount);
      this.formulaCell.setOverlayVisible(false);
      this.adapter.setInlineEditorVisible(true);
    }

    this.editor.focus();

    if (this.barInitiated) {
      this.editor.scrollToStart();
    }

    this.formulaCell.renderValue(this.editor.getValue());
    this.barInitiated = false;
    this.barInitiatedWithFocus = false;
  }

  private switchToBar(): void {
    if (!this.editing) {
      return;
    }

    if (this.formulaCell.overlayMount.hidden) {
      this.formulaCell.setOverlayVisible(true);
      this.editor.attachTo(this.formulaCell.overlayMount);
      this.adapter.setInlineEditorVisible(false);
    }

    this.editor.focus();
  }

  private switchToInline(): void {
    if (!this.editing || !this.inlineMount) {
      return;
    }

    this.editor.attachTo(this.inlineMount);
    this.formulaCell.setOverlayVisible(false);
    this.formulaCell.renderValue(this.editor.getValue());
    this.adapter.setInlineEditorVisible(true);
    this.editor.focus();
  }

  private handleInlineEditClose(): void {
    this.adapter.exitRefSelectionMode();
    this.editor.attachTo(this.formulaCell.overlayMount);
    this.formulaCell.setOverlayVisible(false);
    this.editing = false;
    this.barInitiated = false;
    this.inlineMount = null;

    const active = this.adapter.getActiveCell();

    this.syncSelection(active ? singleCellSelection(active) : null);
  }

  /** Tears down both sub-components and restores the container's classes and `dir`. */
  destroy(): void {
    this.editor.setHostToggleDelegate(null);
    this.events.disposeAll();
    this.addressBox.destroy();
    this.formulaCell.destroy();
    this.container.classList.remove(CN.formulaBar);
    this.container.removeAttribute("dir");

    if (this.sharedClassName !== undefined) {
      this.container.classList.remove(this.sharedClassName);
    }
  }
}
