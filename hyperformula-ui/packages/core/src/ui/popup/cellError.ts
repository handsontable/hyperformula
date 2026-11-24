import { CN } from "../../theme/classNames";

const MAX_DESCRIPTION_LENGTH = 120;
const ERROR_CODE_SEPARATOR = " — ";

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

export function toErrorDescription(message: string): string | null {
  const firstLine = message.split("\n", 1)[0]?.trim() ?? "";
  const separatorIndex = firstLine.indexOf(ERROR_CODE_SEPARATOR);

  if (separatorIndex === -1) {
    return null;
  }

  const body = firstLine.slice(separatorIndex + ERROR_CODE_SEPARATOR.length).trim();
  const sentenceEnd = /[.!?](?=\s|$)/.exec(body);
  const sentence = sentenceEnd ? body.slice(0, sentenceEnd.index + 1) : body;

  if (sentence.length === 0) {
    return null;
  }

  if (sentence.length <= MAX_DESCRIPTION_LENGTH) {
    return sentence;
  }

  const cut = sentence.slice(0, MAX_DESCRIPTION_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
