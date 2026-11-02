export const TokenType = {
  FUNCTION: "FUNCTION",
  CELL_REF: "CELL_REF",
  RANGE_REF: "RANGE_REF",
  NUMBER: "NUMBER",
  STRING: "STRING",
  OPERATOR: "OPERATOR",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  COMMA: "COMMA",
  SEMICOLON: "SEMICOLON",
  WHITESPACE: "WHITESPACE",
  IDENT: "IDENT",
  COMMENT: "COMMENT",
  NAMED_EXPR: "NAMED_EXPR",
  ERROR_LITERAL: "ERROR_LITERAL",
  ERROR: "ERROR",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export function colLettersToIndex(letters: string): number {
  let result = 0;

  for (const char of letters.toUpperCase()) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }

  return result - 1;
}

/**
 * Converts a zero-based column index to A1 column letters (`0` → `A`, `26` → `AA`).
 *
 * @category Utilities
 */
export function indexToColLetters(index: number): string {
  let remaining = index + 1;
  let letters = "";

  while (remaining > 0) {
    const digit = (remaining - 1) % 26;

    letters = String.fromCharCode(65 + digit) + letters;
    remaining = Math.floor((remaining - 1) / 26);
  }

  return letters;
}

export function quoteSheetName(sheet: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(sheet) ? sheet : `'${sheet.replace(/'/g, "''")}'`;
}
