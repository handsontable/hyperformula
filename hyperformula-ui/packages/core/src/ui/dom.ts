import { BUILT_IN_ICONS, type SvgIcon } from "./icons";
import type { IconName, IconsOptions } from "./types";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export type AttrValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, string | number>;

export type Attrs = Record<string, AttrValue>;

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  children?: (Node | string)[],
  ownerDocument: Document = document,
): HTMLElementTagNameMap[K] {
  const element = ownerDocument.createElement(tag);

  if (attrs) {
    applyAttrs(element, attrs);
  }

  if (children) {
    for (const child of children) {
      element.append(typeof child === "string" ? ownerDocument.createTextNode(child) : child);
    }
  }

  return element;
}

function applyAttrs(element: HTMLElement, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (key === "style") {
      if (typeof value === "string") {
        element.setAttribute("style", value);
      } else if (typeof value === "object") {
        for (const [styleKey, styleValue] of Object.entries(
          value as Record<string, string | number>,
        )) {
          element.style.setProperty(styleKey, String(styleValue));
        }
      }

      continue;
    }

    if (key === "class" || key === "className") {
      element.setAttribute("class", String(value));

      continue;
    }

    if (value === true) {
      element.setAttribute(key, "");

      continue;
    }

    element.setAttribute(key, String(value));
  }
}

/**
 * Forces `position: relative` onto a statically-positioned element so absolute overlays can
 * anchor inside it; returns a restore function.
 *
 * @category Utilities
 */
export function ensureRelativePosition(element: HTMLElement): () => void {
  const previousPosition = element.style.position;

  if (getComputedStyle(element).position === "static") {
    element.style.position = "relative";
  }

  return () => {
    element.style.position = previousPosition;
  };
}

export function clear(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function isElement(value: unknown): value is Element {
  return (
    typeof value === "object" && value !== null && (value as Node).nodeType === Node.ELEMENT_NODE
  );
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return isElement(value) && "dataset" in value;
}

export function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" && value !== null && typeof (value as Node).nodeType === "number"
  );
}

export function isShadowRoot(node: Node): node is ShadowRoot {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in node;
}

export function viewOf(node: Node): Window {
  return node.ownerDocument?.defaultView ?? window;
}

export function eventOrigin(event: Event): EventTarget | null {
  return event.composedPath()[0] ?? event.target;
}

export function elementAt(node: Node, x: number, y: number): Element | null {
  const rootNode = node.getRootNode();
  const hitRoot = isShadowRoot(rootNode) ? rootNode : (node.ownerDocument ?? document);

  return hitRoot.elementFromPoint(x, y);
}

export function deepActiveElement(ownerDocument: Document): Element | null {
  let active = ownerDocument.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}

export function findAncestor(
  start: HTMLElement | null,
  matches: (style: CSSStyleDeclaration) => boolean,
): HTMLElement | null {
  let current = start;

  while (current && current !== current.ownerDocument.body) {
    if (matches(getComputedStyle(current))) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function setSvgAttributes(element: SVGElement, attributes: Record<string, string>): void {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

export function createSvgIcon(icon: SvgIcon): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  setSvgAttributes(svg, icon.attributes);

  for (const pathAttributes of icon.paths) {
    const path = document.createElementNS(SVG_NAMESPACE, "path");

    setSvgAttributes(path, pathAttributes);
    svg.appendChild(path);
  }

  return svg;
}

export function createIcon(name: IconName, icons?: IconsOptions): Element {
  return icons?.[name]?.() ?? createSvgIcon(BUILT_IN_ICONS[name]);
}
