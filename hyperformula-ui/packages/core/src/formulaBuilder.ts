import { NullAdapter } from "./adapter/nullAdapter";
import type { CellAddress, Direction, IGridAdapter } from "./adapter/types";
import type { EngineValueChange } from "./engine/types";
import { EventManager, type EventScope } from "./events/eventManager";
import { runAll } from "./events/runAll";
import { FormulaBar } from "./formulaBar/formulaBar";
import { FormulaEditor } from "./formulaEditor/formulaEditor";
import type { FormulaEditorOptions } from "./formulaEditor/types";
import { indexToColLetters } from "./lexer";
import { injectStyles, releaseStyles, type StyleRoot } from "./theme/injectStyles";
import { isShadowRoot } from "./ui/dom";
import { LiveRegion } from "./ui/liveRegion";
import { resolvePhrases } from "./ui/phrases";
import { cellErrorMessage, setCellError } from "./ui/popup/cellError";
import { ErrorPopup } from "./ui/popup/errorPopup";
import { PopupContext } from "./ui/popup/popupContext";
import { withSharedClose } from "./ui/popup/popupsOptions";
import type { LayoutDirection, PopupsOptions } from "./ui/popup/types";
import type { IconsOptions } from "./ui/types";

const reportedMissingContainers = new Set<string>();

function styleRootsFor(
  rootDocument: Document,
  portalParent: HTMLElement | ShadowRoot,
): StyleRoot[] {
  const portalRoot = portalParent.getRootNode();

  return isShadowRoot(portalRoot) ? [rootDocument, portalRoot] : [rootDocument];
}

/**
 * Options for {@link FormulaBuilder}; editor behavior options are inherited from
 * `FormulaEditorOptions`.
 *
 * @category Builder
 */
export interface FormulaBuilderOptions
  extends Omit<
    FormulaEditorOptions,
    "popupCtx" | "adapter" | "suggestionsOptions" | "fnHelpOptions" | "className"
  > {
  /** Element the error popup anchors to — typically the grid root. */
  rootEl: HTMLElement;

  /**
   * Host grid adapter.
   *
   * @defaultValue a no-op `NullAdapter`
   */
  adapter?: IGridAdapter;

  /**
   * The single theming entry point: applied to the popup portal, bar container, editor root,
   * and the adapter's overlay elements; cleared with `null` on `destroy()`.
   */
  className?: string;

  /**
   * Sugar for calling {@link FormulaBuilder.attachFormulaBar} during construction. A selector
   * that matches nothing logs a warning once and the builder starts without a bar.
   */
  formulaBarContainer?: HTMLElement | string;

  /** Popup behavior overrides (shared `showClose` default with per-popup overrides). */
  popups?: PopupsOptions;

  /**
   * Document the grid lives in, such as an iframe's: selector options resolve against it, the
   * styles go into its `<head>`, and the builder's own mount is created in it. The popup portal
   * and the live region are created in `portalParent`'s document.
   *
   * @defaultValue `portalParent`'s document, else the global `document`
   */
  rootDocument?: Document;

  /**
   * Where the popup portal and the screen-reader live region are appended. Pass the grid's
   * shadow root (or an element in it) to keep the popups in the same tree as the editor, so
   * the editor's ARIA references resolve; the styles are then injected into that shadow root
   * too, and container selectors are looked up in it before `rootDocument`. Dock a popup only
   * in the grid's own tree: no other shadow root receives the styles.
   *
   * @defaultValue `rootDocument.body`
   */
  portalParent?: HTMLElement | ShadowRoot;
}

/**
 * Master class wiring the formula-editing experience onto one grid instance: owns the popup
 * context, the error popup, and the single shared `FormulaEditor`, and optionally hosts a
 * `FormulaBar`. Errors render host-side only — adapters call {@link FormulaBuilder.markCell}
 * from their own renderers.
 *
 * @category Builder
 * @example
 * ```ts
 * const builder = new FormulaBuilder({
 *   rootEl: gridRoot,
 *   adapter: new MyGridAdapter(grid),
 *   hyperformula: hf,
 *   formulaBarContainer: "#formula-bar",
 * });
 * builder.openEditor(cellMount, "=SUM(A1:B2)");
 * ```
 */
export class FormulaBuilder {
  private readonly popupCtx: PopupContext;
  private readonly errorPopup: ErrorPopup;
  private readonly liveRegion: LiveRegion;
  private readonly formulaEditor: FormulaEditor;
  private readonly detachedMount: HTMLElement;
  private readonly adapter: IGridAdapter;
  private formulaBar: FormulaBar | null = null;
  private inlineEditScope: EventScope | null = null;
  private readonly events = new EventManager();
  private readonly sharedClassName: string | undefined;
  private readonly direction: LayoutDirection | undefined;
  private readonly icons: IconsOptions | undefined;
  private readonly rootDocument: Document;
  private readonly selectorRoots: ParentNode[];
  private readonly styleRoots: StyleRoot[];
  private destroyed = false;

  constructor(options: FormulaBuilderOptions) {
    const {
      rootEl,
      className,
      adapter,
      hyperformula,
      sheetId,
      direction,
      onCommit,
      onCommitFill,
      onCancel,
      popups,
      icons,
      formulaBarContainer,
    } = options;
    const rootDocument = options.rootDocument ?? options.portalParent?.ownerDocument ?? document;
    const portalParent = options.portalParent ?? rootDocument.body;

    this.rootDocument = rootDocument;

    const portalRoot = portalParent.getRootNode();

    this.selectorRoots = isShadowRoot(portalRoot) ? [portalRoot, rootDocument] : [rootDocument];

    const { container: suggestionsHost, ...suggestionsOwn } = popups?.suggestions ?? {};
    const { container: fnHelpHost, ...fnHelpOwn } = popups?.fnHelp ?? {};
    const suggestionsHostEl = this.resolveOptionalContainer(suggestionsHost, "suggestions host");
    const fnHelpHostEl = this.resolveOptionalContainer(fnHelpHost, "fnHelp host");
    const formulaBarEl = this.resolveOptionalContainer(formulaBarContainer, "formulaBarContainer");

    this.styleRoots = styleRootsFor(rootDocument, portalParent);

    for (const styleRoot of this.styleRoots) {
      injectStyles(styleRoot);
    }

    this.liveRegion = new LiveRegion(portalParent);
    this.adapter = adapter ?? new NullAdapter();
    this.sharedClassName = className;
    this.direction = direction;
    this.icons = icons;

    const baseCommitHandler =
      onCommit ?? ((value: string, direction?: Direction) => this.adapter.commit(value, direction));
    const announcingCommit = (write: () => void): void => {
      const committedAddress = this.adapter.getActiveCell();
      const changes = this.formulaEditor.engine.captureValueChanges(write);

      this.announceCommitErrors(committedAddress, changes);
    };
    const commitHandler = (value: string, direction?: Direction): void =>
      announcingCommit(() => baseCommitHandler(value, direction));
    const baseFillHandler =
      onCommitFill ??
      (this.adapter.commitFill === undefined
        ? undefined
        : (value: string) => this.adapter.commitFill?.(value));
    const fillHandler =
      baseFillHandler === undefined
        ? undefined
        : (value: string): void => announcingCommit(() => baseFillHandler(value));
    const cancelHandler = onCancel ?? (() => this.adapter.cancel());

    if (className !== undefined) {
      this.adapter.setOverlayClassName(className);
    }

    this.popupCtx = new PopupContext({
      parent: portalParent,
      ...(className !== undefined && { className }),
    });

    const suggestionsOptions = withSharedClose(popups?.showClose, suggestionsOwn);
    const fnHelpOptions = withSharedClose(popups?.showClose, fnHelpOwn);
    const errorOptions = withSharedClose(popups?.showClose, popups?.error);

    this.errorPopup = new ErrorPopup({
      container: this.popupCtx.portal,
      ...(errorOptions !== undefined && { options: errorOptions }),
      ...(direction !== undefined && { direction }),
      ...(icons !== undefined && { icons }),
      phrases: resolvePhrases(options.phrases),
    });

    this.detachedMount = rootDocument.createElement("div");

    this.formulaEditor = new FormulaEditor(this.detachedMount, {
      popupCtx: this.popupCtx,
      adapter: this.adapter,
      ...(className !== undefined && { className }),
      ...(hyperformula !== undefined && { hyperformula }),
      ...(sheetId !== undefined && { sheetId }),
      ...(direction !== undefined && { direction }),
      onCommit: commitHandler,
      ...(fillHandler !== undefined && { onCommitFill: fillHandler }),
      onCancel: cancelHandler,
      ...(suggestionsOptions !== undefined && { suggestionsOptions }),
      ...(fnHelpOptions !== undefined && { fnHelpOptions }),
      ...(icons !== undefined && { icons }),
      ...(options.phrases !== undefined && { phrases: options.phrases }),
    });

    this.errorPopup.attach(rootEl);

    const subsScope = this.events.createScope("subscriptions");

    if (this.adapter.outsideClickCommitMode === "emitted") {
      subsScope.add({
        dispose: this.adapter.onOutsideCellClick((address) => {
          this.formulaEditor.closeUnbalancedParens();
          this.formulaEditor.suppressHighlights();
          commitHandler(this.formulaEditor.getValue());
          this.adapter.setActiveCell(address);
        }),
      });
    }

    if (formulaBarEl === undefined) {
      this.subscribeInlineEditLifecycle();
    } else {
      this.attachFormulaBar(formulaBarEl);
    }

    if (suggestionsHostEl !== undefined) {
      this.attachSuggestionsHost(suggestionsHostEl);
    }

    if (fnHelpHostEl !== undefined) {
      this.attachFnHelpHost(fnHelpHostEl);
    }

    subsScope.activate();
  }

  private subscribeInlineEditLifecycle(): void {
    const scope = this.events.createScope("inline-edit");

    scope.add({
      dispose: this.adapter.onInlineEditStart((mount, seed) => this.openEditor(mount, seed)),
    });
    scope.add({
      dispose: this.adapter.onInlineEditClose(() => this.handleInlineEditClose()),
    });
    scope.activate();
    this.inlineEditScope = scope;
  }

  private handleInlineEditClose(): void {
    this.formulaEditor.attachTo(this.detachedMount);
    this.closeEditor();
  }

  private queryContainer(selector: string): HTMLElement | null {
    for (const root of this.selectorRoots) {
      const containerEl = root.querySelector<HTMLElement>(selector);

      if (containerEl !== null) {
        return containerEl;
      }
    }

    return null;
  }

  private resolveContainer(container: HTMLElement | string, label: string): HTMLElement {
    const containerEl = typeof container === "string" ? this.queryContainer(container) : container;

    if (containerEl === null) {
      throw new Error(`FormulaBuilder: ${label} "${container}" not found`);
    }

    return containerEl;
  }

  private findContainer(selector: string): HTMLElement | null {
    try {
      return this.queryContainer(selector);
    } catch {
      return null;
    }
  }

  private resolveOptionalContainer(
    container: HTMLElement | string | undefined,
    label: string,
  ): HTMLElement | undefined {
    if (container === undefined) {
      return undefined;
    }

    const containerEl = typeof container === "string" ? this.findContainer(container) : container;

    if (containerEl !== null) {
      return containerEl;
    }

    const warning = `FormulaBuilder: ${label} "${container}" not found; using the default placement`;

    if (!reportedMissingContainers.has(warning)) {
      reportedMissingContainers.add(warning);
      console.warn(warning);
    }

    return undefined;
  }

  private announceCommitErrors(
    committedAddress: CellAddress | null,
    changes: EngineValueChange[],
  ): void {
    if (!committedAddress) {
      return;
    }

    const committedValue = this.formulaEditor.engine.getCellValue(committedAddress);
    const committedMessage = cellErrorMessage(committedValue);
    const dependentErrorCount = changes.filter(
      (change) =>
        cellErrorMessage(change.newValue) !== null &&
        !(
          change.address.row === committedAddress.row && change.address.col === committedAddress.col
        ),
    ).length;
    const parts: string[] = [];

    if (committedMessage) {
      const cellLabel = `${indexToColLetters(committedAddress.col)}${committedAddress.row + 1}`;

      parts.push(this.formulaEditor.phrases.cellError(cellLabel, committedMessage));
    }

    if (dependentErrorCount > 0) {
      parts.push(this.formulaEditor.phrases.dependentCellErrors(dependentErrorCount));
    }

    if (parts.length > 0) {
      this.liveRegion.announce(parts.join(" "));
    }
  }

  /** Attaches the shared editor to `mount`, seeds it with `seed`, and focuses it. */
  openEditor(mount: HTMLElement, seed: string): void {
    this.formulaEditor.attachTo(mount);
    this.formulaEditor.setValue(seed);
    this.formulaEditor.enterRefSelectionMode();
    this.formulaEditor.focus();
  }

  /** Ends the edit session on the adapter side: exits ref-selection and clears highlights. */
  closeEditor(): void {
    this.adapter.exitRefSelectionMode();
    this.adapter.setHighlights([]);
  }

  /**
   * Mounts a formula bar into `container` (element or selector) and hands it the shared
   * editor, replacing the barless inline-edit subscription. Throws when a selector matches
   * nothing.
   */
  attachFormulaBar(container: HTMLElement | string): void {
    if (this.destroyed) {
      return;
    }

    const containerEl = this.resolveContainer(container, "formulaBarContainer");

    this.formulaBar?.destroy();
    this.inlineEditScope?.dispose();
    this.inlineEditScope = null;
    this.formulaBar = new FormulaBar(containerEl, {
      adapter: this.adapter,
      editor: this.formulaEditor,
      knownFunctions: this.formulaEditor.knownFunctionNames,
      liveRegion: this.liveRegion,
      ...(this.sharedClassName !== undefined && { className: this.sharedClassName }),
      ...(this.direction !== undefined && { direction: this.direction }),
      ...(this.icons !== undefined && { icons: this.icons }),
    });
  }

  /** Destroys the attached bar and restores the barless inline-edit subscription. */
  detachFormulaBar(): void {
    if (this.destroyed || this.formulaBar === null) {
      return;
    }

    this.formulaBar.destroy();
    this.formulaBar = null;
    this.subscribeInlineEditLifecycle();
  }

  /**
   * Docks the suggestions popup into `container` (element or selector) instead of the
   * floating overlay. Throws when a selector matches nothing.
   */
  attachSuggestionsHost(container: HTMLElement | string): void {
    if (this.destroyed) {
      return;
    }

    this.formulaEditor.attachSuggestionsHost(this.resolveContainer(container, "suggestions host"));
  }

  /** Restores the suggestions popup to the floating overlay. */
  detachSuggestionsHost(): void {
    if (this.destroyed) {
      return;
    }

    this.formulaEditor.detachSuggestionsHost();
  }

  /**
   * Docks the function-help popup into `container` (element or selector) instead of the
   * floating overlay. Throws when a selector matches nothing.
   */
  attachFnHelpHost(container: HTMLElement | string): void {
    if (this.destroyed) {
      return;
    }

    this.formulaEditor.attachFnHelpHost(this.resolveContainer(container, "fnHelp host"));
  }

  /** Restores the function-help popup to the floating overlay. */
  detachFnHelpHost(): void {
    if (this.destroyed) {
      return;
    }

    this.formulaEditor.detachFnHelpHost();
  }

  /**
   * Marks or clears a cell's error state from its computed `value`. Called by adapters inside
   * host-specific renderers — the host renders the error, core never does.
   */
  markCell(cellEl: HTMLElement, value: unknown): void {
    setCellError(cellEl, cellErrorMessage(value));
  }

  /** The single shared editor instance this builder owns. */
  get editor(): FormulaEditor {
    return this.formulaEditor;
  }

  /** Whether a formula bar is currently attached. */
  get hasFormulaBar(): boolean {
    return this.formulaBar !== null;
  }

  /**
   * Tears down everything the builder owns (bar, editor, popups, subscriptions) and clears
   * the theming class from the adapter overlay. Idempotent. The adapter itself is host-owned
   * and is NOT destroyed. Safe to call after the host has destroyed the HyperFormula
   * instance. A step that throws does not stop the others; the first error is rethrown once
   * every step has run.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    runAll([
      () => this.events.disposeAll(),
      () => this.formulaBar?.destroy(),
      () => this.formulaEditor.destroy(),
      () => this.errorPopup.destroy(),
      () => this.liveRegion.destroy(),
      () => this.popupCtx.destroy(),
      () => {
        if (this.sharedClassName !== undefined) {
          this.adapter.setOverlayClassName(null);
        }
      },
      ...this.styleRoots.map((styleRoot) => () => releaseStyles(styleRoot)),
    ]);
  }
}
