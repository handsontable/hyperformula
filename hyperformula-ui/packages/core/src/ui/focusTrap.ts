const FOCUSABLE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  onExit?: () => void;
  exitKeys?: string[];
}

export class FocusTrap {
  private readonly onExit: (() => void) | undefined;
  private readonly exitKeys: string[];

  constructor(
    private readonly root: HTMLElement,
    { onExit, exitKeys = ["Escape"] }: FocusTrapOptions = {},
  ) {
    this.onExit = onExit;
    this.exitKeys = exitKeys;
  }

  private focusableElements(): HTMLElement[] {
    const candidates = this.root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    return Array.from(candidates).filter(
      (element) =>
        !element.hidden &&
        !(element as HTMLElement & { disabled?: boolean }).disabled &&
        element.getAttribute("aria-hidden") !== "true",
    );
  }

  private focusNext(backward = false): boolean {
    const focusables = this.focusableElements();

    if (focusables.length === 0) {
      return false;
    }

    const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

    if (currentIndex === -1) {
      focusables[backward ? focusables.length - 1 : 0]?.focus();

      return true;
    }

    const step = backward ? -1 : 1;
    const nextIndex = (currentIndex + step + focusables.length) % focusables.length;

    focusables[nextIndex]?.focus();

    return true;
  }

  focusFirst(): boolean {
    const first = this.focusableElements()[0];

    if (!first) {
      return false;
    }

    first.focus();

    return true;
  }

  hasFocus(): boolean {
    return this.root.contains(document.activeElement);
  }

  interceptKeydown(event: KeyboardEvent): void {
    if (this.exitKeys.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      this.onExit?.();

      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    if (this.focusNext(event.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
