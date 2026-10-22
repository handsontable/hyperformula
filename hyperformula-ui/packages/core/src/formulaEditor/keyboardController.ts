import { cycleRefAbsolute } from "../adapter/refAbsolute";
import type { Direction } from "../adapter/types";
import { TokenType } from "../lexer/tokens";
import { isFormula } from "./editorContext";
import { applyEditorEdit } from "./editorEdit";
import type { HighlightController } from "./highlightController";
import { BINDINGS } from "./keymap";
import type { PointModeController } from "./pointModeController";
import type { PopupController } from "./popupController";
import type { RefController } from "./refController";
import { ShortcutManager } from "./shortcutManager";
import type { EditorContext, HostToggleDelegate, KeyContext } from "./types";

export class KeyboardController {
  private readonly manager = new ShortcutManager();
  private currentDirection: Direction = "down";
  private rangeMode: "auto" | "on" | "off" = "auto";
  private hostToggle: HostToggleDelegate | null = null;

  constructor(
    private readonly ctx: EditorContext,
    private readonly highlights: HighlightController,
    private readonly refs: RefController,
    private readonly popupCtrl: PopupController,
    private readonly point: PointModeController,
    private readonly getValue: () => string,
  ) {
    this.manager.setBindings(BINDINGS);
    this.registerCommands();
  }

  private directionOf(key: string): Direction {
    if (key === "ArrowUp") {
      return "up";
    }

    if (key === "ArrowLeft") {
      return "left";
    }

    if (key === "ArrowRight") {
      return "right";
    }

    return "down";
  }

  private isTabTraversalCommit(direction: Direction): boolean {
    return direction === "left" || direction === "right";
  }

  private isPointEligible(): boolean {
    if (this.rangeMode === "on") {
      return true;
    }

    if (this.rangeMode === "off") {
      return false;
    }

    if (this.point.isActive()) {
      return this.refs.hasPendingRefAtCaret();
    }

    return this.refs.canInsertRef();
  }

  private buildContext(): KeyContext {
    return {
      popupOpen: this.ctx.suggestions.isVisible(),
      fnHelpOpen: this.ctx.fnHelp.isVisible(),
      isFormula: isFormula(this.ctx.kernel),
    };
  }

  private arrow(options: { motion: "step" | "edge"; extend: boolean }): boolean {
    if (this.isPointEligible()) {
      if (options.motion === "edge") {
        return this.point.jump(this.currentDirection, options.extend);
      }

      return this.point.move(this.currentDirection, options.extend);
    }

    this.rangeMode = "off";

    return false;
  }

  private toggleRangeMode(): boolean {
    if (this.isPointEligible()) {
      this.rangeMode = "off";
      this.point.exit();

      return true;
    }

    this.rangeMode = "on";
    this.point.toggle();

    return true;
  }

  private registerCommands(): void {
    this.manager.register("suggestionDown", () => {
      this.ctx.suggestions.move(1);

      return true;
    });

    this.manager.register("suggestionUp", () => {
      this.ctx.suggestions.move(-1);

      return true;
    });

    this.manager.register("acceptSuggestion", () => {
      this.ctx.suggestions.selectActive();

      return true;
    });

    this.manager.register("focusFnHelp", () => this.ctx.fnHelp.focusFirst());

    this.manager.register("focusFnHelpBack", () => this.ctx.fnHelp.focusFirst());

    this.manager.register("toggleEditorHost", () => this.toggleEditorHost());

    this.manager.register("toggleEditorHostBack", () => this.toggleEditorHost());

    this.manager.register("closeSuggestions", () => {
      this.popupCtrl.markSuggestionsSuppressed();
      this.ctx.suggestions.close();

      return true;
    });

    this.manager.register("closeFnHelp", () => {
      this.popupCtrl.markFnHelpSuppressed();
      this.ctx.fnHelp.close();

      return true;
    });

    this.manager.register("insertNewline", () => {
      this.insertNewline();

      return true;
    });

    this.manager.register("pointMove", () => this.arrow({ motion: "step", extend: false }));

    this.manager.register("pointExtend", () => this.arrow({ motion: "step", extend: true }));

    this.manager.register("pointJump", () => this.arrow({ motion: "edge", extend: false }));

    this.manager.register("pointExtendJump", () => this.arrow({ motion: "edge", extend: true }));

    this.manager.register("commitDown", () => this.commit("down"));

    this.manager.register("commitRight", () => this.commit("right"));

    this.manager.register("commitUp", () => this.commit("up"));

    this.manager.register("commitLeft", () => this.commit("left"));

    this.manager.register("commitFill", () => this.commitFill());

    this.manager.register("togglePointMode", () => this.toggleRangeMode());

    this.manager.register("cycleRef", () => this.cycleRefAtCaret());

    this.manager.register("cancel", () => {
      if (this.point.isActive()) {
        this.point.cancel();

        return true;
      }

      if (!this.ctx.opts.onCancel) {
        return false;
      }

      this.highlights.suppress();
      this.ctx.opts.onCancel();

      return true;
    });

    this.manager.register("autoCloseParen", () => {
      this.autoCloseParen();

      return true;
    });

    this.manager.register("skipParen", () => this.skipParen());
  }

  private commit(direction: Direction): boolean {
    if (this.isTabTraversalCommit(direction) && this.isCleanBarHosted()) {
      return false;
    }

    if (!this.ctx.opts.onCommit) {
      return false;
    }

    this.closeUnbalancedParens();
    this.highlights.suppress();
    this.ctx.opts.onCommit(this.getValue(), direction);

    return true;
  }

  private commitFill(): boolean {
    if (!this.ctx.opts.onCommitFill) {
      return false;
    }

    this.closeUnbalancedParens();
    this.highlights.suppress();
    this.ctx.opts.onCommitFill(this.getValue());

    return true;
  }

  private skipParen(): boolean {
    const caret = this.ctx.input.getCaret();

    if (this.ctx.kernel.getState().text[caret] === ")") {
      this.ctx.input.setCaret(caret + 1);

      return true;
    }

    return false;
  }

  private autoCloseParen(): void {
    this.refs.resetLastRef();
    const start = this.ctx.input.getCaret();
    const end = this.ctx.input.getSelectionEnd();
    const selected = this.ctx.kernel.getState().text.slice(start, end);

    applyEditorEdit(this.ctx, this.highlights, {
      start,
      end,
      text: `(${selected})`,
      caret: selected ? end + 2 : start + 1,
    });
    this.popupCtrl.maybeShowPopup();
  }

  closeUnbalancedParens(): void {
    const text = this.ctx.kernel.getState().text;

    if (!text.startsWith("=")) {
      return;
    }

    let depth = 0;

    for (const token of this.ctx.kernel.getTokens()) {
      if (token.type === TokenType.LPAREN) {
        depth++;
      } else if (token.type === TokenType.RPAREN) {
        depth = Math.max(0, depth - 1);
      }
    }

    if (depth <= 0) {
      return;
    }

    const caret = this.ctx.input.getCaret();

    applyEditorEdit(this.ctx, this.highlights, {
      start: text.length,
      end: text.length,
      text: ")".repeat(depth),
      caret,
    });
  }

  private insertNewline(): void {
    const caret = this.ctx.input.getCaret();

    applyEditorEdit(this.ctx, this.highlights, {
      start: caret,
      end: caret,
      text: "\n",
      caret: caret + 1,
    });
    this.popupCtrl.maybeShowPopup();
  }

  private cycleRefAtCaret(): boolean {
    const caret = this.ctx.input.getCaret();
    const token = this.ctx.kernel
      .getTokens()
      .find(
        (candidate) =>
          (candidate.type === TokenType.CELL_REF || candidate.type === TokenType.RANGE_REF) &&
          caret >= candidate.start &&
          caret <= candidate.end,
      );

    if (!token) {
      return false;
    }

    const cycled = cycleRefAbsolute(token.value);

    if (cycled === token.value) {
      return false;
    }

    applyEditorEdit(this.ctx, this.highlights, {
      start: token.start,
      end: token.end,
      text: cycled,
      caret: token.start + cycled.length,
    });
    this.refs.markPendingRef(token.start, cycled);
    this.popupCtrl.maybeShowPopup();

    return true;
  }

  private toggleEditorHost(): boolean {
    if (!this.hostToggle?.isAvailable()) {
      return false;
    }

    const target = this.hostToggle.currentHost() === "bar" ? "inline" : "bar";

    this.hostToggle.focusHost(target);

    return true;
  }

  handleKeydown(event: KeyboardEvent): void {
    this.currentDirection = this.directionOf(event.key);
    this.manager.dispatch(event, this.buildContext());
  }

  resetRangeMode(): void {
    this.rangeMode = "auto";
  }

  setHostToggleDelegate(delegate: HostToggleDelegate | null): void {
    this.hostToggle = delegate;
  }

  isCleanBarHosted(): boolean {
    if (!this.hostToggle) {
      return false;
    }

    return this.hostToggle.currentHost() === "bar" && !(this.hostToggle.isDirty?.() ?? true);
  }
}
