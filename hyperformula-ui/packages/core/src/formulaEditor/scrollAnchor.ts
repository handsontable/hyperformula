import type { EventScope } from "../events/eventManager";
import type { EditorContext } from "./types";

export class ScrollAnchor {
  private scrollRaf = 0;
  private scrollArrivedDuringFrame = false;
  private attached = false;

  private readonly onInputScroll = (): void => {
    this.ctx.overlay.root.scrollTop = this.ctx.input.textarea.scrollTop;
    this.ctx.overlay.root.scrollLeft = this.ctx.input.textarea.scrollLeft;
  };

  private readonly onAncestorScroll = (event: Event): void => this.handleAncestorScroll(event);

  constructor(
    private readonly ctx: EditorContext,
    private readonly reanchor: () => void,
    private readonly scope: EventScope,
  ) {}

  private handleAncestorScroll(event: Event): void {
    if (!this.attached) {
      return;
    }

    if (this.ctx.suggestions.contains(event.target as Node)) {
      return;
    }

    if (this.ctx.fnHelp.contains(event.target as Node)) {
      return;
    }

    if (!(this.ctx.suggestions.isVisible() || this.ctx.fnHelp.isVisible())) {
      return;
    }

    if (this.scrollRaf) {
      this.scrollArrivedDuringFrame = true;

      return;
    }

    this.scheduleReanchor(true);
  }

  private scheduleReanchor(settleAfter: boolean): void {
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;

      if (this.ctx.input.textarea.getClientRects().length === 0) {
        this.scrollArrivedDuringFrame = false;
        this.ctx.suggestions.close();
        this.ctx.fnHelp.close();

        return;
      }

      this.reanchor();

      const sawScrollDuringFrame = this.scrollArrivedDuringFrame;
      this.scrollArrivedDuringFrame = false;
      const popupStillVisible = this.ctx.suggestions.isVisible() || this.ctx.fnHelp.isVisible();

      if ((sawScrollDuringFrame || settleAfter) && popupStillVisible) {
        this.scheduleReanchor(sawScrollDuringFrame);
      }
    });
  }

  attach(): void {
    this.attached = true;
    this.scope.listen(this.ctx.input.textarea, "scroll", this.onInputScroll);
    this.scope.add({
      dispose: () => {
        this.scrollArrivedDuringFrame = false;

        if (this.scrollRaf) {
          cancelAnimationFrame(this.scrollRaf);
          this.scrollRaf = 0;
        }
      },
    });
    this.scope.activate();
  }

  listenToView(viewScope: EventScope, view: Window): void {
    viewScope.listen(view, "scroll", this.onAncestorScroll, { capture: true });
  }

  detach(): void {
    this.attached = false;
    this.scope.deactivate();
    this.scrollArrivedDuringFrame = false;

    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = 0;
    }
  }
}
