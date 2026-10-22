import { RE_CELL, RE_SHEET_BARE, RE_SHEET_QUOTED } from "./patterns";
import { colLettersToIndex } from "./tokens";

export interface CellMatch {
  text: string;
  length: number;
  meta: { col: number; row: number; abs: { col: boolean; row: boolean } };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildNumberPattern(decimalSeparator: string): RegExp {
  const decimal = escapeRegExp(decimalSeparator);

  return new RegExp(
    `\\d+(?:${decimal}\\d+)?(?:[eE][+-]?\\d+)?|${decimal}\\d+(?:[eE][+-]?\\d+)?`,
    "y",
  );
}

export function matchSticky(pattern: RegExp, text: string, pos: number): RegExpExecArray | null {
  pattern.lastIndex = pos;

  return pattern.exec(text);
}

export function matchCell(text: string, pos: number): CellMatch | null {
  const match = matchSticky(RE_CELL, text, pos);

  if (!match || match.index !== pos) {
    return null;
  }

  const [whole, absCol, letters, absRow, digits] = match;
  const col = colLettersToIndex(letters ?? "");
  const row = Number.parseInt(digits ?? "0", 10) - 1;

  return {
    text: whole,
    length: whole.length,
    meta: { col, row, abs: { col: absCol === "$", row: absRow === "$" } },
  };
}

export function matchSheetPrefix(
  text: string,
  pos: number,
): { sheet: string; length: number } | null {
  const quotedMatch = matchSticky(RE_SHEET_QUOTED, text, pos);

  if (quotedMatch && quotedMatch.index === pos) {
    return {
      sheet: (quotedMatch[1] ?? "").replace(/''/g, "'"),
      length: quotedMatch[0].length,
    };
  }

  const bareMatch = matchSticky(RE_SHEET_BARE, text, pos);

  if (bareMatch && bareMatch.index === pos) {
    return { sheet: bareMatch[1] ?? "", length: bareMatch[0].length };
  }

  return null;
}
