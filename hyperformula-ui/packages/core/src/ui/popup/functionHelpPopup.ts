import type { FunctionSignature } from "../../engine/types";
import { CN } from "../../theme/classNames";
import { createEl, createIcon, isNode } from "../dom";
import { FocusTrap } from "../focusTrap";
import type { IconsOptions, Phrases } from "../types";
import { BasePopup } from "./basePopup";
import type { AnchorRect, FunctionHelpOptions } from "./types";

export interface FunctionHelpPopupOptions {
  onExplicitClose?: () => void;
  onVisibilityChange?: (visible: boolean, tooltipId: string) => void;
  onFocusReturn?: () => void;
  onFocusLeave?: (nextTarget: Node | null) => void;
  container?: HTMLElement;
  options?: FunctionHelpOptions;
  icons?: IconsOptions;
  phrases?: Phrases;
}

let tooltipIdCounter = 0;

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

function isWebUrl(url: string): boolean {
  try {
    return WEB_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

function signatureParamLabel(
  param: FunctionSignature["params"][number],
  index: number,
  total: number,
  repeatLast: number,
): string {
  const isRepeating = repeatLast > 0 && index >= total - repeatLast;

  if (param.optional && isRepeating) {
    return `[${param.label}, ...]`;
  }

  if (param.optional) {
    return `[${param.label}]`;
  }

  if (isRepeating) {
    return `${param.label}, ...`;
  }

  return param.label;
}

function paramListLabel(
  param: FunctionSignature["params"][number],
  index: number,
  total: number,
  repeatLast: number,
): string {
  const isRepeating = repeatLast > 0 && index >= total - repeatLast;
  const base = isRepeating ? `${param.label}...` : param.label;
  const annotations: string[] = [];

  if (param.optional) {
    annotations.push("[optional]");
  }

  if (isRepeating) {
    annotations.push("repeatable");
  }

  return annotations.length > 0 ? `${base} - ${annotations.join(" ")}` : base;
}

export class FunctionHelpPopup extends BasePopup {
  private signature: FunctionSignature | null = null;
  private activeIndex = 0;
  private readonly onVisibilityChange: ((visible: boolean, tooltipId: string) => void) | undefined;
  private readonly onFocusReturn: (() => void) | undefined;
  private readonly onFocusLeave: ((nextTarget: Node | null) => void) | undefined;
  private readonly focusTrap: FocusTrap;

  constructor({
    onExplicitClose,
    onVisibilityChange,
    onFocusReturn,
    onFocusLeave,
    container,
    options,
    icons,
    phrases,
  }: FunctionHelpPopupOptions = {}) {
    super({
      ...(container !== undefined && { container }),
      ...(options?.showClose !== undefined && { showClose: options.showClose }),
      ...(onExplicitClose !== undefined && { onExplicitClose }),
      ...(icons !== undefined && { icons }),
      ...(phrases !== undefined && { phrases }),
    });
    tooltipIdCounter += 1;
    this.root.id = `${CN.fnHelp}-${tooltipIdCounter}`;
    this.onVisibilityChange = onVisibilityChange;
    this.onFocusReturn = onFocusReturn;
    this.onFocusLeave = onFocusLeave;
    this.focusTrap = new FocusTrap(this.root, {
      onExit: () => this.onFocusReturn?.(),
      exitKeys: ["F6"],
    });
    const focusScope = this.events.createScope("fn-help-focus");

    focusScope.listen(this.root, "keydown", (event) => {
      event.stopPropagation();

      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
        this.onExplicitClosed();

        return;
      }

      if (event.key === "Tab" && this.isAttachedToHost) {
        return;
      }

      this.focusTrap.interceptKeydown(event);
    });
    focusScope.listen(this.root, "focusout", (event) => {
      if (!this.isVisible()) {
        return;
      }

      const nextTarget = isNode(event.relatedTarget) ? event.relatedTarget : null;

      if (nextTarget && this.root.contains(nextTarget)) {
        return;
      }

      this.onFocusLeave?.(nextTarget);
    });
    focusScope.activate();
  }

  protected createRoot(): HTMLElement {
    return createEl("div", {
      class: CN.fnHelp,
      role: "dialog",
      "aria-label": this.phrases.functionHelp,
      "aria-keyshortcuts": "F6",
      hidden: true,
    });
  }

  focusFirst(): boolean {
    return this.focusTrap.focusFirst();
  }

  protected renderContent(): void {
    if (!this.signature) {
      return;
    }

    const signature = this.signature;
    const activeArg = this.clampActive(signature, this.activeIndex);
    const body = createEl("div", { class: CN.fnHelpBody });

    this.root.appendChild(this.renderSignatureRow(signature, activeArg));

    if (signature.example) {
      body.appendChild(this.renderLabeledSection("Example", signature.example, CN.fnHelpExample));
    }

    if (signature.description) {
      body.appendChild(this.renderLabeledSection("About", signature.description, CN.fnHelpAbout));
    }

    if (signature.params.length > 0) {
      body.appendChild(createEl("hr", { class: CN.fnHelpSeparator }));

      for (let index = 0; index < signature.params.length; index++) {
        const param = signature.params[index];

        if (param) {
          body.appendChild(this.renderParamRow(param, index, signature, activeArg));
        }
      }
    }

    if (body.childElementCount > 0) {
      body.tabIndex = 0;
    }

    this.root.appendChild(body);

    if (signature.docUrl && isWebUrl(signature.docUrl)) {
      this.root.appendChild(createEl("hr", { class: CN.fnHelpSeparator }));
      this.root.appendChild(this.renderLearnMore(signature.docUrl));
    }
  }

  private clampActive(signature: FunctionSignature, activeIndex: number): number {
    if (signature.params.length === 0) {
      return -1;
    }

    if (activeIndex < signature.params.length) {
      return activeIndex;
    }

    return signature.repeatLast > 0 ? signature.params.length - 1 : -1;
  }

  private renderSignatureRow(signature: FunctionSignature, activeArg: number): HTMLDivElement {
    const row = createEl("div", { class: CN.fnHelpSignature });

    row.appendChild(createEl("span", { class: CN.fnHelpName }, [signature.name]));
    row.appendChild(document.createTextNode("("));

    const total = signature.params.length;

    signature.params.forEach((param, index) => {
      if (index > 0) {
        row.appendChild(document.createTextNode(", "));
      }

      const label = signatureParamLabel(param, index, total, signature.repeatLast);
      const className =
        index === activeArg ? `${CN.fnHelpArg} ${CN.fnHelpArgActive}` : CN.fnHelpArg;

      row.appendChild(createEl("span", { class: className }, [label]));
    });

    if (total === 0 && signature.repeatLast > 0) {
      row.appendChild(document.createTextNode("…"));
    }

    row.appendChild(document.createTextNode(")"));

    return row;
  }

  private renderLabeledSection(
    label: string,
    value: string,
    valueClassName: string,
  ): HTMLDivElement {
    const section = createEl("div", { class: CN.fnHelpSection });

    section.appendChild(createEl("span", { class: CN.fnHelpSectionLabel }, [label]));
    section.appendChild(createEl("span", { class: valueClassName }, [value]));

    return section;
  }

  private renderParamRow(
    param: FunctionSignature["params"][number],
    index: number,
    signature: FunctionSignature,
    activeArg: number,
  ): HTMLDivElement {
    const section = createEl("div", { class: CN.fnHelpSection });
    const nameClass =
      index === activeArg
        ? `${CN.fnHelpParamName} ${CN.fnHelpParamNameActive}`
        : CN.fnHelpParamName;
    const label = paramListLabel(param, index, signature.params.length, signature.repeatLast);

    section.appendChild(createEl("span", { class: nameClass }, [label]));

    if (param.description) {
      section.appendChild(createEl("span", { class: CN.fnHelpParamDesc }, [param.description]));
    }

    return section;
  }

  private renderLearnMore(docUrl: string): HTMLAnchorElement {
    const link = createEl("a", {
      class: CN.fnHelpLearnMore,
      href: docUrl,
      target: "_blank",
      rel: "noopener noreferrer",
    });

    this.renderListen(link, "mousedown", (event) => {
      event.preventDefault();
    });
    link.appendChild(document.createTextNode(this.phrases.learnMore));
    link.appendChild(createIcon("externalLink", this.icons));

    return link;
  }

  show(signature: FunctionSignature, activeIndex: number, anchor: AnchorRect): void {
    const contentUnchanged =
      this.isVisible() &&
      this.signature?.name === signature.name &&
      this.activeIndex === activeIndex;

    if (contentUnchanged) {
      this.reposition(anchor);

      return;
    }

    this.signature = signature;
    this.activeIndex = activeIndex;
    this.root.setAttribute("aria-label", this.phrases.functionHelpFor(signature.name));
    this.open(anchor);
  }

  protected override onVisibilityChanged(visible: boolean): void {
    this.onVisibilityChange?.(visible, this.root.id);
  }

  override close(): void {
    const wasVisible = this.isVisible();
    const hadFocus = this.focusTrap.hasFocus();

    super.close();

    if (wasVisible && hadFocus) {
      this.onFocusReturn?.();
    }
  }
}
