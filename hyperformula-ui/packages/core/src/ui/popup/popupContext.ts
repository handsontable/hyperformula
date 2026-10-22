import { CN } from "../../theme/classNames";

export interface PopupContextOptions {
  parent?: HTMLElement;
  className?: string;
}

export class PopupContext {
  readonly portal: HTMLElement;

  constructor({ parent = document.body, className }: PopupContextOptions = {}) {
    this.portal = document.createElement("div");
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
