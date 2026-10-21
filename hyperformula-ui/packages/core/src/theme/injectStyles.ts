import { CSS_TEXT } from "./cssText";

const CORE_STYLE_MARKER = "data-hfe-styles";

const refCounts = new Map<string, number>();

/**
 * Ref-counted style handle returned by {@link createStyleInjector}.
 *
 * @category Theming
 */
export interface StyleInjector {
  /** Increments the ref count; appends the `<style>` tag on first injection. */
  inject(): void;

  /** Decrements the ref count; removes the tag when the last holder releases. */
  release(): void;
}

/**
 * Creates a ref-counted, SSR-guarded injector that maintains one `<style [marker]>` tag in
 * `document.head`. Adapters reuse it to auto-inject their own generated `cssText`.
 *
 * @category Theming
 */
export function createStyleInjector(marker: string, cssText: string): StyleInjector {
  return {
    inject(): void {
      if (typeof document === "undefined") {
        return;
      }

      refCounts.set(marker, (refCounts.get(marker) ?? 0) + 1);

      if (document.head.querySelector(`style[${marker}]`)) {
        return;
      }

      const styleEl = document.createElement("style");

      styleEl.setAttribute(marker, "");
      styleEl.textContent = cssText;
      document.head.appendChild(styleEl);
    },
    release(): void {
      if (typeof document === "undefined") {
        return;
      }

      const remaining = Math.max(0, (refCounts.get(marker) ?? 0) - 1);

      refCounts.set(marker, remaining);

      if (remaining === 0) {
        document.head.querySelector(`style[${marker}]`)?.remove();
      }
    },
  };
}

const coreInjector = createStyleInjector(CORE_STYLE_MARKER, CSS_TEXT);

export function injectStyles(): void {
  coreInjector.inject();
}

export function releaseStyles(): void {
  coreInjector.release();
}
