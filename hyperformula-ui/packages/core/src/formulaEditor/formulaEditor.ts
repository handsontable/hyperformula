import { isSingleCell } from "../adapter/range";
import { formatWholeRef } from "../adapter/refFormat";
import type { CellAddress, CellRange, EditorGridAdapter, HeaderAxis } from "../adapter/types";
import { EngineBridge } from "../engine/engineBridge";
import { annotateNamedExprs } from "../engine/namedExpr";
import { EventManager } from "../events/eventManager";
import { runAll } from "../events/runAll";
import { commentsToN, nToComments } from "../kernel/commentTransform";
import { Kernel } from "../kernel/kernel";
import type { LexerOptions } from "../lexer/types";
import { CN } from "../theme/classNames";
import { injectStyles, releaseStyles } from "../theme/injectStyles";
import { createEl } from "../ui/dom";
import { FunctionHelpPopup } from "../ui/popup/functionHelpPopup";
import { SuggestionsPopup } from "../ui/popup/suggestionsPopup";
import { RichInput } from "../ui/text/richInput";
import { VisualOverlay } from "../ui/text/visualOverlay";
import { isFormula } from "./editorContext";
import { EditorSizeController } from "./editorSizeController";
import { HighlightController } from "./highlightController";
import { KeyboardController } from "./keyboardController";
import { PointModeController } from "./pointModeController";
import { PopupController } from "./popupController";
import { RefController } from "./refController";
import { ScrollAnchor } from "./scrollAnchor";
import type {
  EditorContext,
  FormulaEditorEvents,
  FormulaEditorOptions,
  HostToggleDelegate,
} from "./types";

/**
 * The engine-agnostic formula editor: a textarea + colored overlay with autocomplete,
 * function help, ref highlights, and keyboard point-mode. One instance per grid, owned by
 * `FormulaBuilder` and reparented between the inline cell mount and the formula bar via
 * {@link FormulaEditor.attachTo}. Requires a DOM environment.
 *
 * @category Editor
 */
export class FormulaEditor {
  readonly kernel: Kernel;
  readonly engine: EngineBridge;
  readonly adapter: EditorGridAdapter;
  private readonly separators: LexerOptions;
  private readonly refOpeners: string;
  private readonly rootEl: HTMLDivElement;
  private readonly layersEl: HTMLDivElement;
  private readonly input: RichInput;
  private readonly knownFunctions: ReadonlySet<string>;
  private readonly overlay: VisualOverlay;
  private readonly suggestions: SuggestionsPopup;
  private readonly fnHelp: FunctionHelpPopup;
  private readonly opts: FormulaEditorOptions;
  private readonly ctx: EditorContext;
  private readonly highlights: HighlightController;
  private readonly refs: RefController;
  private readonly popupCtrl!: PopupController;
  private readonly point: PointModeController;
  private readonly keyboard: KeyboardController;
  private readonly scroll: ScrollAnchor;
  private readonly size: EditorSizeController;
  private readonly events = new EventManager();
  private adapterUnsubs: Array<() => void> = [];
  private destroyed = false;
  private focused = false;
  private reparenting = false;

  constructor(container: HTMLElement, opts: FormulaEditorOptions) {
    if (typeof document === "undefined") {
      throw new Error("FormulaEditor requires a DOM environment.");
    }

    injectStyles();
    this.opts = opts;
    const engineOpts: ConstructorParameters<typeof EngineBridge>[0] = {};

    if (opts.hyperformula !== undefined) {
      engineOpts.hyperformula = opts.hyperformula;
    }

    if (opts.language !== undefined) {
      engineOpts.language = opts.language;
    }

    if (opts.sheetId !== undefined) {
      engineOpts.sheetId = opts.sheetId;
    }

    this.engine = new EngineBridge(engineOpts);
    const separators = this.engine.getSeparators();

    this.separators = separators;
    this.kernel = new Kernel(separators);
    this.refOpeners = `=+-*/^&<>(:${separators.argSeparator}${separators.arrayRowSeparator}`;
    this.kernel.tokenPostProcess = (tokens) =>
      annotateNamedExprs(tokens, (name) => this.engine.resolveNamedExpression(name));
    this.adapter = opts.adapter;

    const inputScope = this.events.createScope("editor-input");
    this.input = new RichInput(inputScope);
    inputScope.activate();
    this.knownFunctions = new Set(this.engine.getFunctionNames().map((name) => name.toUpperCase()));
    this.overlay = new VisualOverlay({ knownFunctions: this.knownFunctions });
    this.suggestions = new SuggestionsPopup(
      {
        onSelect: (item) => this.popupCtrl.applySuggestionSelection(item),
        onExplicitClose: () => this.popupCtrl.markSuggestionsSuppressed(),
        onAriaStateChange: (state) => this.popupCtrl.applySuggestionsAria(state),
      },
      {
        showKeyboardHelp: true,
        showNamedExpressions: true,
        ...opts.suggestionsOptions,
      },
      opts.popupCtx.portal,
      opts.icons,
    );
    this.fnHelp = new FunctionHelpPopup({
      onExplicitClose: () => {
        this.popupCtrl.markFnHelpSuppressed();
      },
      onFocusReturn: () => this.input.focus(),
      onFocusLeave: (nextTarget) => {
        if (nextTarget && this.rootEl.contains(nextTarget)) {
          return;
        }

        this.handleFocusExit(nextTarget);
      },
      onVisibilityChange: (visible, tooltipId) =>
        this.popupCtrl.applyFnHelpAria(visible, tooltipId),
      container: opts.popupCtx.portal,
      ...(opts.fnHelpOptions !== undefined && { options: opts.fnHelpOptions }),
      ...(opts.icons !== undefined && { icons: opts.icons }),
    });

    this.rootEl = createEl("div", { class: CN.editor });

    if (opts.className !== undefined) {
      this.rootEl.classList.add(opts.className);
    }

    if (opts.direction === "rtl") {
      this.rootEl.setAttribute("dir", "rtl");
    }

    this.layersEl = createEl("div", { class: CN.editorLayers });
    this.layersEl.append(this.overlay.root, this.input.textarea);
    this.rootEl.append(this.layersEl);

    this.size = new EditorSizeController(
      this.rootEl,
      this.overlay.root,
      this.input.textarea,
      this.events.createScope("editor-size"),
      () => this.popupCtrl?.maybeShowPopup(),
    );
    this.attachTo(container);

    this.ctx = {
      kernel: this.kernel,
      engine: this.engine,
      adapter: this.adapter,
      input: this.input,
      overlay: this.overlay,
      suggestions: this.suggestions,
      fnHelp: this.fnHelp,
      rootEl: this.rootEl,
      opts: this.opts,
      refOpeners: this.refOpeners,
      argSeparator: separators.argSeparator,
    };
    this.highlights = new HighlightController(this.ctx);
    this.refs = new RefController(this.ctx, this.highlights, () =>
      this.popupCtrl?.maybeShowPopup(),
    );
    this.popupCtrl = new PopupController(this.ctx, this.highlights, this.refs);
    this.point = new PointModeController(this.ctx, this.refs, this.highlights);
    this.keyboard = new KeyboardController(
      this.ctx,
      this.highlights,
      this.refs,
      this.popupCtrl,
      this.point,
      () => this.getValue(),
    );
    this.scroll = new ScrollAnchor(
      this.ctx,
      () => this.popupCtrl.maybeShowPopup(),
      this.events.createScope("popup-anchor"),
    );

    this.wireUi();
    this.wireAdapter();

    if (opts.initialValue) {
      this.setValue(opts.initialValue);
    }
  }

  private applyFocusState(focused: boolean): void {
    this.focused = focused;
    this.rootEl.classList.toggle(CN.editorFocused, focused);

    if (focused) {
      this.highlights.resume();
      this.highlights.pushHighlights();
    }

    this.kernel.bus.emit("focus", { focused });

    if (!focused) {
      this.suggestions.close();
      this.fnHelp.close();

      if (!this.refs.isRefSelectionActive()) {
        this.highlights.suppress();
      }
    }
  }

  private restoreBlurTarget(relatedTarget: EventTarget | null): void {
    if (relatedTarget instanceof HTMLElement && relatedTarget.isConnected) {
      relatedTarget.focus();
    }
  }

  private handleFocusExit(nextTarget: EventTarget | null): void {
    this.applyFocusState(false);

    if (this.keyboard.isCleanBarHosted()) {
      this.opts.onCancel?.();
      this.restoreBlurTarget(nextTarget);
    }
  }

  private syncFormulaClass(): void {
    this.rootEl.classList.toggle(CN.editorFormula, isFormula(this.kernel));
  }

  private wireUi(): void {
    this.input.on("input", (text, caret) => {
      this.highlights.resume();
      this.refs.resetLastRef();
      this.point.exit();
      this.keyboard.resetRangeMode();
      this.popupCtrl.resetSuppression();
      this.kernel.applyEdit(text, { offset: caret });
      this.syncFormulaClass();
      this.highlights.afterMutation();
      this.size.scheduleUpdate();
      this.popupCtrl.maybeShowPopup();
    });
    this.input.on("caretmove", (caret) => {
      if (!this.kernel.setCaret({ offset: caret })) {
        return;
      }

      this.highlights.afterMutation();
      this.popupCtrl.maybeShowPopup();
    });
    this.input.on("focus", (focused, relatedTarget) => {
      if (!focused && this.reparenting) {
        return;
      }

      if (!focused && relatedTarget instanceof Node && this.fnHelp.contains(relatedTarget)) {
        return;
      }

      if (focused) {
        this.applyFocusState(true);

        return;
      }

      this.handleFocusExit(relatedTarget);
    });
    this.input.on("keydown", (event) => this.keyboard.handleKeydown(event));
    this.scroll.attach();
    this.size.attach();
  }

  private wireAdapter(): void {
    this.adapterUnsubs.push(
      this.adapter.onCellPick((pick) => {
        this.point.deactivate();
        this.refs.tryInsertRef(this.adapter.formatRef(pick.ref), false, pick.append);
      }),
    );
    this.adapterUnsubs.push(
      this.adapter.onRangePick((pick) => {
        this.point.deactivate();
        this.refs.tryInsertRef(this.adapter.formatRef(pick.ref), false, pick.append);
      }),
    );
    this.adapterUnsubs.push(
      this.adapter.onHeaderPick?.((pick) => {
        this.point.deactivate();
        this.refs.tryInsertRef(formatWholeRef(pick), false, pick.append);
      }) ?? (() => {}),
    );
  }

  /** Force-enables or disables ref insertion, overriding the caret-derived eligibility. */
  setRefActive(active: boolean): void {
    this.refs.setRefActive(active);
  }

  setHostToggleDelegate(delegate: HostToggleDelegate | null): void {
    this.keyboard.setHostToggleDelegate(delegate);
  }

  /** Whether a picked ref would currently be inserted at the caret. */
  canInsertRef(): boolean {
    return this.refs.canInsertRef();
  }

  /** Whether the editor input currently has focus. */
  isFocused(): boolean {
    return this.focused;
  }

  /** Whether ref-selection is currently eligible (grid picks would insert refs). */
  isRefSelectionActive(): boolean {
    return this.refs.isRefSelectionActive();
  }

  /**
   * Puts the adapter into ref-selection mode, wired to this editor's preview colors and
   * pick eligibility.
   */
  enterRefSelectionMode(): void {
    this.adapter.enterRefSelectionMode(
      (range, append, wholeAxis) => this.getRefPreviewColor(range, append, wholeAxis),
      () => this.isRefSelectionActive(),
    );
  }

  /** Suppresses grid highlights until the next resume (focus, input, or non-silent `setValue`). */
  suppressHighlights(): void {
    this.highlights.suppress();
  }

  /** Function names known to the engine, used to seed idle colored-formula views. */
  get knownFunctionNames(): ReadonlySet<string> {
    return this.knownFunctions;
  }

  /** Returns the highlight color `target` would receive if picked now. */
  getRefPreviewColor(
    target: CellAddress | CellRange,
    append = false,
    wholeAxis?: HeaderAxis,
  ): string {
    const replacingToken = append ? undefined : (this.refs.pendingRefRange() ?? undefined);

    if (wholeAxis && "start" in target) {
      const refStr = formatWholeRef({
        axis: wholeAxis,
        sheet: target.start.sheet,
        start: wholeAxis === "column" ? target.start.col : target.start.row,
        end: wholeAxis === "column" ? target.end.col : target.end.row,
        append,
      });

      return this.highlights.previewColorFor(refStr, replacingToken);
    }

    const collapsed = "start" in target && isSingleCell(target) ? target.start : target;
    const refStr = this.ctx.adapter.formatRef(collapsed);

    return this.highlights.previewColorFor(refStr, replacingToken);
  }

  /**
   * Replaces the editor text with `text` in storage form: `+ N("comment")` calls are
   * converted to the internal `// comment` syntax via `nToComments`. Always write the value
   * through this method — bypassing the transform corrupts the comment round-trip.
   */
  setValue(text: string, options?: { silentHighlights?: boolean; caret?: number }): void {
    const internal = nToComments(text, this.separators);
    const caretOffset = Math.min(options?.caret ?? internal.length, internal.length);

    this.point.exit();
    this.keyboard.resetRangeMode();
    this.refs.resetLastRef();
    this.input.setText(internal);
    this.input.setCaret(caretOffset);
    this.kernel.applyEdit(internal, { offset: caretOffset });
    this.syncFormulaClass();
    this.highlights.renderOverlay();
    this.size.refresh();

    if (!options?.silentHighlights) {
      this.highlights.resume();
      this.highlights.pushHighlights();
    }
  }

  /**
   * Returns the editor text in storage form: internal `// comment` syntax is converted to
   * `+ N("comment")` via `commentsToN`. Always read the value through this method —
   * bypassing the transform corrupts the cell value stored in the host grid.
   */
  getValue(): string {
    return commentsToN(this.kernel.getState().text, this.separators);
  }

  /**
   * Reports whether the editor currently holds a formula (text starting with `=`).
   * Cheap guard for hot paths: reads the kernel text directly, skipping the
   * `commentsToN` tokenization that `getValue` performs — the transform never
   * changes the first character, so the two always agree.
   *
   * @category Editing
   */
  isFormula(): boolean {
    return this.kernel.getState().text.startsWith("=");
  }

  /** Round-trips `text` through the comment transforms, returning its normalized storage form. */
  normalizeFormula(text: string): string {
    return commentsToN(nToComments(text, this.separators), this.separators);
  }

  /** Appends the closing parens an unbalanced formula needs before committing. */
  closeUnbalancedParens(): void {
    this.keyboard.closeUnbalancedParens();
  }

  /** Returns the caret offset in the internal text. */
  getCaretOffset(): number {
    return this.input.getCaret();
  }

  /** Moves the caret to `offset` in the internal text. */
  setCaretOffset(offset: number): void {
    this.input.setCaret(offset);
    this.kernel.setCaret({ offset });
  }

  /**
   * MOVES the editor root into `container`, preserving focus and caret — the reparent
   * invariant: DOM listeners survive the move; the editor must never be
   * destroyed-and-recreated to switch hosts.
   */
  attachTo(container: HTMLElement): void {
    const wasFocused = this.focused;
    const caretOffset = this.getCaretOffset();

    this.engine.invalidateNamedExpressionCache();
    this.reparenting = true;

    try {
      container.appendChild(this.rootEl);
      this.size.resetManualSize();
      this.size.invalidateCache();
      this.popupCtrl?.invalidateClipCache();
      this.size.refresh();

      if (wasFocused) {
        this.focus();
        this.setCaretOffset(caretOffset);
      }
    } finally {
      this.reparenting = false;
    }
  }

  /** Docks the suggestions popup into `container` instead of the floating overlay. */
  attachSuggestionsHost(container: HTMLElement): void {
    this.suggestions.attachToHost(container, this.opts.className);
  }

  /** Restores the suggestions popup to the floating overlay. */
  detachSuggestionsHost(): void {
    this.suggestions.detachFromHost();
  }

  /** Docks the function-help popup into `container` instead of the floating overlay. */
  attachFnHelpHost(container: HTMLElement): void {
    this.fnHelp.attachToHost(container, this.opts.className);
  }

  /** Restores the function-help popup to the floating overlay. */
  detachFnHelpHost(): void {
    this.fnHelp.detachFromHost();
  }

  /** Focuses the editor input and pushes the current ref highlights to the grid. */
  focus(): void {
    this.focused = true;
    this.highlights.pushHighlights();
    this.input.focus();
  }

  /** Scrolls the editor back to its first line without moving the caret. */
  scrollToStart(): void {
    this.input.textarea.scrollTop = 0;
    this.overlay.root.scrollTop = 0;
  }

  /** Re-pushes the current ref highlights to the grid (e.g. after a host re-render). */
  refreshHighlights(): void {
    this.highlights.pushHighlights();
  }

  /** Subscribes to a {@link FormulaEditorEvents} event; returns the unsubscribe function. */
  on<K extends keyof FormulaEditorEvents>(
    name: K,
    callback: (payload: FormulaEditorEvents[K]) => void,
  ): () => void {
    return this.kernel.bus.on(name, callback);
  }

  /** Tears down popups, listeners, and grid highlights. Idempotent. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    const adapterUnsubs = this.adapterUnsubs;

    this.adapterUnsubs = [];
    runAll([
      () => this.events.disposeAll(),
      () => this.engine.destroy(),
      () => this.suggestions.destroy(),
      () => this.fnHelp.destroy(),
      () => this.scroll.detach(),
      () => this.size.detach(),
      ...adapterUnsubs,
      () => this.adapter.setHighlights([]),
      () => this.adapter.clearHighlights(),
      () => this.kernel.bus.clear(),
      () => this.rootEl.remove(),
      () => releaseStyles(),
    ]);
  }
}
