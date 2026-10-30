import { CN } from "../theme/classNames";
import { activeCallContext, currentFunctionPrefix } from "../ui/caret/tokenContext";
import { findAncestor, viewOf } from "../ui/dom";
import { orderSuggestionItems } from "../ui/popup/suggestionsPopup";
import type { AnchorRect, SuggestionItem, SuggestionsAriaState } from "../ui/popup/types";
import { isFormula } from "./editorContext";
import { applyEditorEdit } from "./editorEdit";
import type { HighlightController } from "./highlightController";
import type { RefController } from "./refController";
import type { EditorContext } from "./types";

export class PopupController {
  private suggestionsSuppressed = false;
  private fnHelpSuppressed = false;
  private cachedClip: HTMLElement | null | undefined;

  constructor(
    private readonly ctx: EditorContext,
    private readonly highlights: HighlightController,
    private readonly refs: RefController,
  ) {}

  private anchorAt(skipClip: boolean): AnchorRect | null {
    const rootRect = this.ctx.rootEl.getBoundingClientRect();
    const bar = this.ctx.rootEl.closest(`.${CN.formulaBar}`);
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const top = barRect ? barRect.top : rootRect.top;
    const bottom = barRect ? Math.max(barRect.bottom, rootRect.bottom) : rootRect.bottom;

    if (!skipClip) {
      const clip = this.scrollClipRect();

      if (
        bottom <= clip.top ||
        top >= clip.bottom ||
        rootRect.right <= clip.left ||
        rootRect.left >= clip.right
      ) {
        return null;
      }
    }

    return {
      left: rootRect.left,
      top,
      height: bottom - top,
      width: rootRect.width,
      direction: this.ctx.opts.direction ?? "ltr",
    };
  }

  private scrollClipAncestor(): HTMLElement | null {
    if (this.cachedClip === undefined) {
      this.cachedClip = findAncestor(
        this.ctx.rootEl.parentElement,
        ({ overflowX, overflowY }) =>
          /auto|scroll|hidden|clip/.test(overflowY) || /auto|scroll|hidden|clip/.test(overflowX),
      );
    }

    return this.cachedClip;
  }

  private scrollClipRect(): { top: number; bottom: number; left: number; right: number } {
    const clip = this.scrollClipAncestor();

    if (clip) {
      const rect = clip.getBoundingClientRect();

      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    }

    const view = viewOf(this.ctx.rootEl);

    return { top: 0, bottom: view.innerHeight, left: 0, right: view.innerWidth };
  }

  invalidateClipCache(): void {
    this.cachedClip = undefined;
  }

  resetSuppression(): void {
    this.suggestionsSuppressed = false;
    this.fnHelpSuppressed = false;
  }

  markSuggestionsSuppressed(): void {
    this.suggestionsSuppressed = true;
  }

  markFnHelpSuppressed(): void {
    this.fnHelpSuppressed = true;
  }

  maybeShowPopup(): void {
    if (!this.refs.isRefActive() || !isFormula(this.ctx.kernel)) {
      this.ctx.suggestions.close();
      this.ctx.fnHelp.close();

      return;
    }

    const offset = this.ctx.input.getCaret();
    const tokens = this.ctx.kernel.getTokens();

    const prefixContext = currentFunctionPrefix(tokens, offset);
    const callContext = activeCallContext(tokens, offset);

    const suggestionsEligible =
      !this.suggestionsSuppressed && prefixContext !== null && prefixContext.prefix.length > 0;
    const fnHelpEligible = !this.fnHelpSuppressed && callContext !== null;

    if (!suggestionsEligible && !fnHelpEligible) {
      this.ctx.suggestions.close();

      if (callContext) {
        this.ctx.fnHelp.close();
      } else {
        this.fnHelpSuppressed = false;
        this.ctx.fnHelp.close();
      }

      return;
    }

    if (suggestionsEligible && prefixContext) {
      const fnItems: SuggestionItem[] = this.ctx.engine
        .filterFunctionEntries(prefixContext.prefix)
        .map((entry) =>
          entry.shortDescription
            ? { value: entry.name, description: entry.shortDescription }
            : { value: entry.name },
        );

      const namedItems: SuggestionItem[] = this.ctx.suggestions.showNamedExpressions
        ? this.ctx.engine.filterNamedExpressions(prefixContext.prefix).map((name) => {
            const range = this.ctx.engine.formatNamedRange(name);
            const item: SuggestionItem = { value: name, kind: "named" };

            if (range !== undefined) {
              item.description = range;
            }

            return item;
          })
        : [];

      const items = orderSuggestionItems([...fnItems, ...namedItems], prefixContext.prefix);

      if (items.length > 0) {
        const anchor = this.anchorAt(this.ctx.suggestions.isAttachedToHost);

        if (anchor) {
          this.ctx.fnHelp.close();
          this.ctx.suggestions.show(items, anchor, prefixContext.prefix);

          return;
        }
      }
    }

    this.ctx.suggestions.close();

    const signature =
      fnHelpEligible && callContext ? this.ctx.engine.getFunctionSignature(callContext.name) : null;

    if (fnHelpEligible && signature) {
      const anchor = this.anchorAt(this.ctx.fnHelp.isAttachedToHost);

      if (anchor) {
        this.ctx.fnHelp.show(signature, callContext.argIndex, anchor);
      } else {
        this.ctx.fnHelp.close();
      }
    } else if (callContext) {
      this.ctx.fnHelp.close();
    } else {
      this.fnHelpSuppressed = false;
      this.ctx.fnHelp.close();
    }
  }

  applySuggestionSelection(item: SuggestionItem): void {
    const offset = this.ctx.input.getCaret();
    const tokens = this.ctx.kernel.getTokens();
    const prefixContext = currentFunctionPrefix(tokens, offset);

    if (!prefixContext) {
      return;
    }

    this.refs.resetLastRef();

    const isNamed = item.kind === "named";
    const insertText = isNamed ? item.value : `${item.value}()`;
    const caret = prefixContext.start + item.value.length + (isNamed ? 0 : 1);

    applyEditorEdit(this.ctx, this.highlights, {
      start: prefixContext.start,
      end: offset,
      text: insertText,
      caret,
    });
    this.maybeShowPopup();
  }

  applySuggestionsAria(state: SuggestionsAriaState): void {
    const textarea = this.ctx.input.textarea;

    textarea.setAttribute("aria-expanded", state.expanded ? "true" : "false");

    if (state.expanded) {
      textarea.setAttribute("aria-controls", state.listboxId);
    } else {
      textarea.removeAttribute("aria-controls");
    }

    if (state.activeOptionId === null) {
      textarea.removeAttribute("aria-activedescendant");
    } else {
      textarea.setAttribute("aria-activedescendant", state.activeOptionId);
    }
  }

  applyFnHelpAria(visible: boolean, tooltipId: string): void {
    const textarea = this.ctx.input.textarea;

    if (visible) {
      textarea.setAttribute("aria-describedby", tooltipId);
    } else if (textarea.getAttribute("aria-describedby") === tooltipId) {
      textarea.removeAttribute("aria-describedby");
    }
  }
}
