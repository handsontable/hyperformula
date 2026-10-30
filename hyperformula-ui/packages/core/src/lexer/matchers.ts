import { RE_CELL, RE_SHEET_BARE } from "./patterns";
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

const NO_CLOSING_QUOTE = -1;

export function buildQuotedSheetEnds(text: string): Int32Array {
  const ends = new Int32Array(text.length + 2).fill(NO_CLOSING_QUOTE);

  for (let i = text.length - 1; i >= 0; i--) {
    const next = text.charAt(i + 1);

    if (text.charAt(i) !== "'") {
      ends[i] = ends[i + 1] ?? NO_CLOSING_QUOTE;
    } else if (next === "'") {
      ends[i] = ends[i + 2] ?? NO_CLOSING_QUOTE;
    } else if (next === "!") {
      ends[i] = i;
    }
  }

  return ends;
}

export function matchSheetPrefix(
  text: string,
  pos: number,
  quotedSheetEnds?: Int32Array,
): { sheet: string; length: number } | null {
  if (text.charAt(pos) === "'") {
    const ends = quotedSheetEnds ?? buildQuotedSheetEnds(text);
    const closingQuote = ends[pos + 1] ?? NO_CLOSING_QUOTE;

    if (closingQuote === NO_CLOSING_QUOTE) {
      return null;
    }

    return {
      sheet: text.slice(pos + 1, closingQuote).replace(/''/g, "'"),
      length: closingQuote + 2 - pos,
    };
  }

  const bareMatch = matchSticky(RE_SHEET_BARE, text, pos);

  if (bareMatch && bareMatch.index === pos) {
    return { sheet: bareMatch[1] ?? "", length: bareMatch[0].length };
  }

  return null;
}
