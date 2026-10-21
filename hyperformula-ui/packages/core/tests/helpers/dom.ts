import { CN } from "../../src/theme/classNames";

export function sel(className: string): string {
  return `.${className}`;
}

export function requireTextarea(host: HTMLElement): HTMLTextAreaElement {
  const textarea = host.querySelector("textarea");

  if (!textarea) {
    throw new Error("expected a <textarea> inside the editor host");
  }

  return textarea;
}

export function requireEditorRoot(host: HTMLElement): HTMLElement {
  const root = host.querySelector<HTMLElement>(sel(CN.editor));

  if (!root) {
    throw new Error("expected the editor root element inside the host");
  }

  return root;
}

export function typeInto(host: HTMLElement, text: string): void {
  const textarea = requireTextarea(host);

  textarea.value = text;
  textarea.selectionStart = text.length;
  textarea.selectionEnd = text.length;
  textarea.dispatchEvent(new Event("input"));
}

export function press(host: HTMLElement, key: string, init: KeyboardEventInit = {}): void {
  requireTextarea(host).dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
}

export function keyUp(host: HTMLElement, key = "Enter"): void {
  requireTextarea(host).dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
}

export function blurEditor(host: HTMLElement): void {
  requireTextarea(host).dispatchEvent(new Event("blur"));
}

export function focusEditor(host: HTMLElement): void {
  requireTextarea(host).dispatchEvent(new Event("focus"));
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
