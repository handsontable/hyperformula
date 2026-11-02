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
 * and `aria-invalid`. Adapter-facing: the host renders the error, core never does.
 *
 * @category Popups
 */
export function setCellError(element: HTMLElement, message: string | null): void {
  if (message) {
    element.classList.add(CN.cellError);
    element.dataset.hfeError = message;
    element.setAttribute("aria-invalid", "true");
  } else {
    element.classList.remove(CN.cellError);
    delete element.dataset.hfeError;
    element.removeAttribute("aria-invalid");
  }
}
