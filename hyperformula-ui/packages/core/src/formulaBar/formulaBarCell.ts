import { EventManager } from "../events";
import { nToComments } from "../kernel/commentTransform";
import { Lexer } from "../lexer";
import type { LexerOptions, Token } from "../lexer/types";
import { CN } from "../theme/classNames";
import { createEl, createIcon } from "../ui/dom";
import { VisualOverlay } from "../ui/text/visualOverlay";
import type { IconsOptions } from "../ui/types";

/**
 * Options for {@link FormulaBarCell}.
 *
 * @category Formula Bar
 */
export interface FormulaBarCellOptions {
  /** Function names used to color the idle formula view. */
  knownFunctions: ReadonlySet<string>;

  /** Fires when the idle view is clicked to start a bar-initiated edit. */
  onActivate: () => void;

  /**
   * Lexer separator overrides matching the engine's locale.
   *
   * @defaultValue the lexer defaults (`,` argument separator, `.` decimal separator)
   */
  separators?: Partial<LexerOptions>;

  /** Host factories replacing the built-in icons; the cell renders the `function` icon. */
  icons?: IconsOptions;

  /**
   * Post-processes the lexed tokens before they render, the same step the editor's kernel
   * applies, so the idle view and the editor color references alike.
   */
  tokenPostProcess?: (tokens: Token[], text: string) => Token[];
}

/**
 * The bar's fx-icon + formula area: owns the idle read-only colored-formula view and the
 * `overlayMount` the shared editor attaches into while bar-hosted.
 *
 * @category Formula Bar
 */
export class FormulaBarCell {
  /** The cell's root element, appended into the bar container by {@link FormulaBar}. */
  readonly root: HTMLElement;
  private readonly events = new EventManager();
  private readonly lexer: Lexer;
  private readonly separators: Partial<LexerOptions> | undefined;
  private readonly tokenPostProcess: ((tokens: Token[], text: string) => Token[]) | undefined;
  private lastValue = "";
  private readonly idleOverlay: VisualOverlay;
  private readonly fxIcon: Element;
  private readonly bodyEl: HTMLElement;
  private readonly idleEl: HTMLElement;
  private readonly overlayEl: HTMLElement;

  constructor(options: FormulaBarCellOptions) {
    this.separators = options.separators;
    this.tokenPostProcess = options.tokenPostProcess;
    this.lexer = new Lexer(options.separators);
    this.root = createEl("div", { class: `${CN.formulaBarCell} ${CN.formulaBarCellFormula}` });
    this.fxIcon = createIcon("function", options.icons);
    this.fxIcon.classList.add(CN.formulaBarFxIcon);
    this.idleOverlay = new VisualOverlay({
      knownFunctions: options.knownFunctions,
      exposedToAccessibility: true,
    });
    this.idleEl = createEl("div", {
      class: CN.formulaBarIdle,
      tabindex: "0",
      role: "textbox",
      "aria-label": "Formula input",
    });
    this.idleEl.appendChild(this.idleOverlay.root);
    this.overlayEl = createEl("div", { class: CN.formulaBarOverlay });
    this.overlayEl.hidden = true;
    this.bodyEl = createEl("div", { class: CN.formulaBarBody });
    this.bodyEl.append(this.idleEl, this.overlayEl);
    this.root.append(this.fxIcon, this.bodyEl);

    const scope = this.events.createScope("formula-cell", { stopPropagation: true });

    scope.listen(this.idleEl, "mousedown", (event: MouseEvent) => {
      event.preventDefault();
      options.onActivate();
    });
    scope.listen(this.idleEl, "focus", () => options.onActivate());
    scope.activate();
  }

  /** The mount the shared editor `attachTo`'s while the edit is bar-hosted. */
  get overlayMount(): HTMLElement {
    return this.overlayEl;
  }

  /**
   * Renders `text` (storage form) into the idle colored view via `nToComments`. No-ops while
   * the editor overlay is showing — the idle view sits behind it, so a mid-edit render would
   * be invisible work.
   */
  renderValue(text: string): void {
    this.lastValue = text;

    if (!this.overlayEl.hidden) {
      return;
    }

    const display = nToComments(text, this.separators);
    const lexed = this.lexer.tokenize(display);
    const tokens = this.tokenPostProcess ? this.tokenPostProcess(lexed, display) : lexed;

    this.idleEl.classList.toggle(CN.editorFormula, text.startsWith("="));
    this.idleOverlay.render(tokens, display);
  }

  /** Re-renders the last value passed to {@link FormulaBarCell.renderValue}. */
  refresh(): void {
    this.renderValue(this.lastValue);
  }

  /** Toggles between the editor overlay (`true`) and the idle view (`false`). */
  setOverlayVisible(visible: boolean): void {
    this.overlayEl.hidden = !visible;
    this.idleEl.setAttribute("tabindex", visible ? "-1" : "0");

    if (visible) {
      this.idleEl.setAttribute("aria-hidden", "true");
    } else {
      this.idleEl.removeAttribute("aria-hidden");
    }
  }

  /** Removes the cell from the DOM and disposes its listeners. */
  destroy(): void {
    this.events.disposeAll();
    this.root.remove();
  }
}
