import { CN } from "../theme/classNames";
import { createEl } from "./dom";

const ANNOUNCE_DELAY_MS = 30;

/**
 * Visually-hidden polite `aria-live` region for screen-reader announcements; messages are
 * cleared then re-set after a short delay so repeat announcements are re-spoken.
 *
 * @category Utilities
 */
export class LiveRegion {
  /**
   * The hidden live-region element, created in `container`'s document and appended to
   * `container` (default `document.body`).
   */
  readonly root: HTMLElement;
  private announceTimer: number | null = null;

  constructor(container: HTMLElement | ShadowRoot = document.body) {
    this.root = createEl(
      "div",
      {
        class: CN.liveRegion,
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      },
      undefined,
      container.ownerDocument,
    );
    container.appendChild(this.root);
  }

  private cancelPending(): void {
    if (this.announceTimer !== null) {
      window.clearTimeout(this.announceTimer);
      this.announceTimer = null;
    }
  }

  /** Speaks `message`, replacing any announcement still pending. */
  announce(message: string): void {
    this.cancelPending();
    this.root.textContent = "";
    this.announceTimer = window.setTimeout(() => {
      this.root.textContent = message;
      this.announceTimer = null;
    }, ANNOUNCE_DELAY_MS);
  }

  /** Cancels any pending announcement and removes the element from the DOM. */
  destroy(): void {
    this.cancelPending();
    this.root.remove();
  }
}
