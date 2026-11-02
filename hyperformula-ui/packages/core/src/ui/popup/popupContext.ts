import { CN } from "../../theme/classNames";

export interface PopupContextOptions {
  parent?: HTMLElement | ShadowRoot;
  className?: string;
}

export class PopupContext {
  readonly portal: HTMLElement;

  constructor({ parent = document.body, className }: PopupContextOptions = {}) {
    this.portal = parent.ownerDocument.createElement("div");
    this.portal.classList.add(CN.popupPortal);

    if (className !== undefined) {
      this.portal.classList.add(className);
    }

    parent.appendChild(this.portal);
  }

  destroy(): void {
    this.portal.remove();
  }
}
