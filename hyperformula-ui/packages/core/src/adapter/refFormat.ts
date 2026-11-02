import { indexToColLetters, quoteSheetName } from "../lexer/tokens";
import type { CellAddress, CellRange, HeaderPick } from "./types";

function fmtAddress(address: CellAddress): string {
  const prefix = address.sheet ? `${quoteSheetName(address.sheet)}!` : "";

  return `${prefix}${indexToColLetters(address.col)}${address.row + 1}`;
}

/**
 * Formats an address or range in A1 syntax, prefixing the sheet name (quoted when needed).
 *
 * @category Utilities
 */
export function formatRef(ref: CellAddress | CellRange): string {
  if ("start" in ref) {
    return `${fmtAddress(ref.start)}:${indexToColLetters(ref.end.col)}${ref.end.row + 1}`;
  }

  return fmtAddress(ref);
}

/**
 * Formats a whole-row/column {@link HeaderPick} in A1 syntax (e.g. `B:D`, `2:5`), prefixing
 * the sheet name (quoted when needed).
 *
 * @category Utilities
 */
export function formatWholeRef(pick: HeaderPick): string {
  const min = Math.min(pick.start, pick.end);
  const max = Math.max(pick.start, pick.end);
  const prefix = pick.sheet ? `${quoteSheetName(pick.sheet)}!` : "";

  if (pick.axis === "column") {
    return `${prefix}${indexToColLetters(min)}:${indexToColLetters(max)}`;
  }

  return `${prefix}${min + 1}:${max + 1}`;
}
