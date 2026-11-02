import { CSS_TEXT } from "./cssText";

const CORE_STYLE_MARKER = "data-hfe-styles";

const refCountsByRoot = new WeakMap<Document | ShadowRoot, Map<string, number>>();

/**
 * Where an injected stylesheet lives: a document (its `<head>`) or a shadow root.
 *
 * @category Theming
 */
export type StyleRoot = Document | ShadowRoot;

/**
 * Ref-counted style handle returned by {@link createStyleInjector}.
 *
 * @category Theming
 */
export interface StyleInjector {
  /**
   * Increments the ref count for `root` (default: the global `document`); appends the
   * `<style>` tag on first injection.
   */
  inject(root?: StyleRoot): void;

  /** Decrements the ref count for `root`; removes the tag when its last holder releases. */
  release(root?: StyleRoot): void;
}

function defaultRoot(): StyleRoot | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function styleContainer(root: StyleRoot): ParentNode {
  return "head" in root ? root.head : root;
}

function ownerDocumentOf(root: StyleRoot): Document {
  return "head" in root ? root : root.ownerDocument;
}

/**
 * Creates a ref-counted, SSR-guarded injector that maintains one `<style [marker]>` tag per
 * document (in its `<head>`) or shadow root. Adapters reuse it to auto-inject their own
 * generated `cssText`.
 *
 * @category Theming
 */
export function createStyleInjector(marker: string, cssText: string): StyleInjector {
  return {
    inject(root: StyleRoot | undefined = defaultRoot()): void {
      if (root === undefined) {
        return;
      }

      const refCounts = refCountsByRoot.get(root) ?? new Map<string, number>();

      refCountsByRoot.set(root, refCounts);
      refCounts.set(marker, (refCounts.get(marker) ?? 0) + 1);

      const container = styleContainer(root);

      if (container.querySelector(`style[${marker}]`)) {
        return;
      }

      const styleEl = ownerDocumentOf(root).createElement("style");

      styleEl.setAttribute(marker, "");
      styleEl.textContent = cssText;
      container.appendChild(styleEl);
    },
    release(root: StyleRoot | undefined = defaultRoot()): void {
      if (root === undefined) {
        return;
      }

      const refCounts = refCountsByRoot.get(root);
      const remaining = Math.max(0, (refCounts?.get(marker) ?? 0) - 1);

      refCounts?.set(marker, remaining);

      if (remaining === 0) {
        styleContainer(root).querySelector(`style[${marker}]`)?.remove();
      }
    },
  };
}

const coreInjector = createStyleInjector(CORE_STYLE_MARKER, CSS_TEXT);

export function injectStyles(root?: StyleRoot): void {
  coreInjector.inject(root);
}

export function releaseStyles(root?: StyleRoot): void {
  coreInjector.release(root);
}
