import { isSingleCell } from "../adapter/range";
import type { GridSelection } from "../adapter/types";
import { EventManager } from "../events";
import { colLettersToIndex, indexToColLetters } from "../lexer";
import { CN } from "../theme/classNames";
import { createEl } from "../ui/dom";
import { DEFAULT_PHRASES } from "../ui/phrases";
import type { Phrases } from "../ui/types";

const A1_PATTERN = /^([A-Za-z]{1,3})(\d{1,7})$/;
const RANGE_PATTERN = /^([A-Za-z]{1,3})(\d{1,7}):([A-Za-z]{1,3})(\d{1,7})$/;

/**
 * Sheet-less cell coordinates a typed `A1` address resolves to.
 *
 * @category Formula Bar
 */
export interface AddressBoxTarget {
  col: number;
  row: number;
}

/**
 * Normalized coordinates a typed `A1:B5` range resolves to.
 *
 * @category Formula Bar
 */
export interface AddressBoxRange {
  start: AddressBoxTarget;
  end: AddressBoxTarget;
}

/**
 * Outcome of an address-box navigation: `true` accepted, `false` not a target in the grid,
 * `"unavailable"` a valid target the grid could not select (a hidden or filtered-out cell).
 *
 * @category Formula Bar
 */
export type AddressBoxNavigation = boolean | "unavailable";

/**
 * Options for {@link FormulaBarAddressBox}. Each navigation callback returns its
 * {@link AddressBoxNavigation} outcome; a rejected one reverts the input to the last-synced
 * address and reports the rejected text through `onInvalidInput` or `onUnavailableTarget`.
 *
 * @category Formula Bar
 */
export interface FormulaBarAddressBoxOptions {
  onNavigate: (target: AddressBoxTarget) => AddressBoxNavigation;
  onNavigateRange: (range: AddressBoxRange) => AddressBoxNavigation;
  onInvalidInput?: (text: string) => void;

  /** Receives the text of a valid address or range the grid could not select. */
  onUnavailableTarget?: (text: string) => void;

  /**
   * Phrases for the input's accessible name.
   *
   * @defaultValue {@link DEFAULT_PHRASES}
   */
  phrases?: Pick<Phrases, "cellAddress">;
}

function formatTarget(target: AddressBoxTarget): string {
  return `${indexToColLetters(target.col)}${target.row + 1}`;
}

let addressInputIdCounter = 0;

/**
 * The bar's `A1`-style jump-to-cell/range input: Enter commits via the navigation callbacks,
 * Escape or blur reverts to the last-synced address.
 *
 * @category Formula Bar
 */
export class FormulaBarAddressBox {
  /** The box's root element, appended into the bar container by {@link FormulaBar}. */
  readonly root: HTMLElement;
  private readonly options: FormulaBarAddressBoxOptions;
  private readonly events = new EventManager();
  private readonly input: HTMLInputElement;
  private currentText = "";
  private readonly stopMouseDownPropagation = (): void => {};

  constructor(options: FormulaBarAddressBoxOptions) {
    this.options = options;
    this.root = createEl("div", { class: `${CN.formulaBarCell} ${CN.formulaBarCellAddress}` });
    addressInputIdCounter += 1;
    this.input = createEl("input", {
      class: CN.formulaBarAddressInput,
      id: `${CN.formulaBarAddressInput}-${addressInputIdCounter}`,
    });
    this.input.spellcheck = false;
    this.input.setAttribute("aria-label", (options.phrases ?? DEFAULT_PHRASES).cellAddress);
    this.root.appendChild(this.input);

    const scope = this.events.createScope("address-box", { stopPropagation: true });

    scope.listen(this.root, "mousedown", this.stopMouseDownPropagation);
    scope.listen(this.input, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.commit();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.revert();
      }
    });
    scope.listen(this.input, "blur", () => this.revert());
    scope.activate();
  }

  private commit(): void {
    const text = this.input.value.trim();

    if (text === "") {
      this.revert();

      return;
    }

    const single = text.match(A1_PATTERN);

    if (single?.[1] && single[2]) {
      this.commitSingle({
        col: colLettersToIndex(single[1].toUpperCase()),
        row: Number(single[2]) - 1,
      });

      return;
    }

    const range = text.match(RANGE_PATTERN);

    if (!range?.[1] || !range[2] || !range[3] || !range[4]) {
      this.rejectInput();

      return;
    }

    const first = {
      col: colLettersToIndex(range[1].toUpperCase()),
      row: Number(range[2]) - 1,
    };
    const second = {
      col: colLettersToIndex(range[3].toUpperCase()),
      row: Number(range[4]) - 1,
    };

    this.commitRange({
      start: { col: Math.min(first.col, second.col), row: Math.min(first.row, second.row) },
      end: { col: Math.max(first.col, second.col), row: Math.max(first.row, second.row) },
    });
  }

  private commitSingle(target: AddressBoxTarget): void {
    const outcome = this.options.onNavigate(target);

    if (outcome !== true) {
      this.rejectInput(outcome);

      return;
    }

    this.accept(formatTarget(target));
  }

  private commitRange(range: AddressBoxRange): void {
    const outcome = this.options.onNavigateRange(range);

    if (outcome !== true) {
      this.rejectInput(outcome);

      return;
    }

    this.accept(`${formatTarget(range.start)}:${formatTarget(range.end)}`);
  }

  private accept(text: string): void {
    this.currentText = text;
    this.input.value = text;
    this.input.blur();
  }

  private revert(): void {
    this.input.value = this.currentText;
  }

  private rejectInput(outcome: AddressBoxNavigation = false): void {
    const rejectedText = this.input.value.trim();

    this.revert();

    if (outcome === "unavailable") {
      this.options.onUnavailableTarget?.(rejectedText);
    } else {
      this.options.onInvalidInput?.(rejectedText);
    }
  }

  /** Mirrors the grid selection into the input (`A1` single cell, `A1:B5` range, empty none). */
  setSelection(selection: GridSelection | null): void {
    if (!selection) {
      this.currentText = "";
    } else if (isSingleCell(selection.range)) {
      this.currentText = formatTarget(selection.range.start);
    } else {
      this.currentText = `${formatTarget(selection.range.start)}:${formatTarget(selection.range.end)}`;
    }

    this.input.value = this.currentText;
  }

  /** Removes the box from the DOM and disposes its listeners. */
  destroy(): void {
    this.events.disposeAll();
    this.root.remove();
  }
}
