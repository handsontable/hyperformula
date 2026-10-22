import { CN } from "../../theme/classNames";

/**
 * Extracts a display message from an engine error value (`#CODE — message`), or `null` when
 * `value` is not an error.
 *
 * @category Popups
 */
export function cellErrorMessage(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "type" in (value as object)) {
    const errorValue = value as { value?: string; type?: string; message?: string };
    const code = errorValue.value || `#${errorValue.type ?? "ERROR"}`;

    return errorValue.message ? `${code} — ${errorValue.message}` : code;
  }

  return null;
}

/**
 * Marks (`message`) or clears (`null`) a cell element's error state — class, data attribute,
 * `aria-invalid`, and an `aria-description` carrying the message, so a screen reader reads
 * the error without the error popup open. Clearing removes the description only when it is
 * the one this function set. Adapter-facing: the host renders the error, core never does.
 *
 * @category Popups
 */
export function setCellError(element: HTMLElement, message: string | null): void {
  const previousMessage = element.dataset.hfeError;

  if (message) {
    element.classList.add(CN.cellError);
    element.dataset.hfeError = message;
    element.setAttribute("aria-invalid", "true");
    element.setAttribute("aria-description", message);

    return;
  }

  element.classList.remove(CN.cellError);
  delete element.dataset.hfeError;
  element.removeAttribute("aria-invalid");

  if (
    previousMessage !== undefined &&
    element.getAttribute("aria-description") === previousMessage
  ) {
    element.removeAttribute("aria-description");
  }
}
