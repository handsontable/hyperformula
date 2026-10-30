import { isAdditiveCloser, isAdditiveOpener, nonTrivialAt } from "./additiveContext";
import {
  buildNumberPattern,
  buildQuotedSheetEnds,
  type CellMatch,
  matchCell,
  matchSheetPrefix,
  matchSticky,
} from "./matchers";
import {
  RE_COMMENT,
  RE_ERROR_LITERAL,
  RE_IDENT,
  RE_OP_MULTI,
  RE_OP_SINGLE,
  RE_STRING,
  RE_WHITESPACE,
  RE_WHOLE_COL,
  RE_WHOLE_ROW,
} from "./patterns";
import { colLettersToIndex, TokenType } from "./tokens";
import type { CellRefMeta, CommentMeta, LexerOptions, RangeRefMeta, Token } from "./types";

const DEFAULT_LEXER_OPTIONS: LexerOptions = {
  decimalSeparator: ".",
  argSeparator: ",",
  arrayColumnSeparator: ",",
  arrayRowSeparator: ";",
};

export class Lexer {
  private readonly options: LexerOptions;
  private readonly numberPattern: RegExp;
  private readonly commaChars: Set<string>;

  constructor(options: Partial<LexerOptions> = {}) {
    this.options = { ...DEFAULT_LEXER_OPTIONS, ...options };
    this.numberPattern = buildNumberPattern(this.options.decimalSeparator);
    this.commaChars = new Set([this.options.argSeparator, this.options.arrayColumnSeparator]);
  }

  private tryConsumeWholeRange(
    text: string,
    startPos: number,
    sheet?: string,
    sheetPrefixLen = 0,
  ): { token: Token; next: number } | null {
    const tokenStart = startPos - sheetPrefixLen;
    const columnMatch = matchSticky(RE_WHOLE_COL, text, startPos);

    if (columnMatch && columnMatch.index === startPos) {
      const [whole, startAbs, startLetters, endAbs, endLetters] = columnMatch;
      const end = startPos + whole.length;
      const meta: RangeRefMeta = {
        ...(sheet === undefined ? {} : { sheet }),
        whole: "column",
        start: {
          col: colLettersToIndex(startLetters ?? ""),
          row: 0,
          abs: { col: startAbs === "$", row: false },
        },
        end: {
          col: colLettersToIndex(endLetters ?? ""),
          row: 0,
          abs: { col: endAbs === "$", row: false },
        },
      };

      return {
        token: {
          type: TokenType.RANGE_REF,
          value: text.slice(tokenStart, end),
          start: tokenStart,
          end,
          meta,
        },
        next: end,
      };
    }

    const rowMatch = matchSticky(RE_WHOLE_ROW, text, startPos);

    if (rowMatch && rowMatch.index === startPos) {
      const [whole, startAbs, startDigits, endAbs, endDigits] = rowMatch;
      const end = startPos + whole.length;
      const meta: RangeRefMeta = {
        ...(sheet === undefined ? {} : { sheet }),
        whole: "row",
        start: {
          col: 0,
          row: Number.parseInt(startDigits ?? "1", 10) - 1,
          abs: { col: false, row: startAbs === "$" },
        },
        end: {
          col: 0,
          row: Number.parseInt(endDigits ?? "1", 10) - 1,
          abs: { col: false, row: endAbs === "$" },
        },
      };

      return {
        token: {
          type: TokenType.RANGE_REF,
          value: text.slice(tokenStart, end),
          start: tokenStart,
          end,
          meta,
        },
        next: end,
      };
    }

    return null;
  }

  private tryConsumeRange(
    text: string,
    startPos: number,
    firstCell: CellMatch,
    sheet?: string,
    sheetPrefixLen = 0,
  ): { token: Token; next: number } | null {
    const afterFirst = startPos + firstCell.length;

    if (text.charAt(afterFirst) !== ":") {
      return null;
    }

    const secondCell = matchCell(text, afterFirst + 1);

    if (!secondCell) {
      return null;
    }

    const end = afterFirst + 1 + secondCell.length;
    const meta: RangeRefMeta = {
      ...(sheet === undefined ? {} : { sheet }),
      start: firstCell.meta,
      end: secondCell.meta,
    };
    const tokenStart = startPos - sheetPrefixLen;

    return {
      token: {
        type: TokenType.RANGE_REF,
        value: text.slice(tokenStart, end),
        start: tokenStart,
        end,
        meta,
      },
      next: end,
    };
  }

  tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;
    let unterminatedStringFound = false;
    const textLength = text.length;
    const quotedSheetEnds = text.includes("'") ? buildQuotedSheetEnds(text) : undefined;

    while (pos < textLength) {
      const start = pos;

      const whitespaceMatch = matchSticky(RE_WHITESPACE, text, pos);

      if (whitespaceMatch && whitespaceMatch.index === pos) {
        const value = whitespaceMatch[0];

        tokens.push({ type: TokenType.WHITESPACE, value, start, end: start + value.length });
        pos += value.length;

        continue;
      }

      const char = text.charAt(pos);

      if (char === '"') {
        const stringMatch = unterminatedStringFound ? null : matchSticky(RE_STRING, text, pos);

        if (stringMatch && stringMatch.index === pos) {
          tokens.push({
            type: TokenType.STRING,
            value: stringMatch[0],
            start,
            end: start + stringMatch[0].length,
          });
          pos += stringMatch[0].length;

          continue;
        }

        unterminatedStringFound = true;
        tokens.push({ type: TokenType.ERROR, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (char === "(") {
        tokens.push({ type: TokenType.LPAREN, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (char === ")") {
        tokens.push({ type: TokenType.RPAREN, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (char === "{") {
        tokens.push({ type: TokenType.LBRACE, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (char === "}") {
        tokens.push({ type: TokenType.RBRACE, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (this.commaChars.has(char)) {
        tokens.push({ type: TokenType.COMMA, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      if (char === this.options.arrayRowSeparator) {
        tokens.push({ type: TokenType.SEMICOLON, value: char, start, end: start + 1 });
        pos++;

        continue;
      }

      const sheet = matchSheetPrefix(text, pos, quotedSheetEnds);

      if (sheet) {
        const afterSheet = pos + sheet.length;
        const firstCell = matchCell(text, afterSheet);

        if (firstCell) {
          const rangeAttempt = this.tryConsumeRange(
            text,
            afterSheet,
            firstCell,
            sheet.sheet,
            sheet.length,
          );

          if (rangeAttempt) {
            tokens.push(rangeAttempt.token);
            pos = rangeAttempt.next;

            continue;
          }

          const meta: CellRefMeta = { sheet: sheet.sheet, ...firstCell.meta };

          tokens.push({
            type: TokenType.CELL_REF,
            value: text.slice(pos, afterSheet + firstCell.length),
            start,
            end: afterSheet + firstCell.length,
            meta,
          });
          pos = afterSheet + firstCell.length;

          continue;
        }

        const wholeAttempt = this.tryConsumeWholeRange(text, afterSheet, sheet.sheet, sheet.length);

        if (wholeAttempt) {
          tokens.push(wholeAttempt.token);
          pos = wholeAttempt.next;

          continue;
        }

        tokens.push({
          type: TokenType.ERROR,
          value: text.slice(pos, afterSheet),
          start,
          end: afterSheet,
        });
        pos = afterSheet;

        continue;
      }

      const cell = matchCell(text, pos);

      if (cell) {
        const rangeAttempt = this.tryConsumeRange(text, pos, cell);

        if (rangeAttempt) {
          tokens.push(rangeAttempt.token);
          pos = rangeAttempt.next;

          continue;
        }

        if (text.charAt(pos + cell.length) !== "(") {
          const meta: CellRefMeta = { ...cell.meta };

          tokens.push({
            type: TokenType.CELL_REF,
            value: cell.text,
            start,
            end: start + cell.length,
            meta,
          });
          pos += cell.length;

          continue;
        }
      }

      const wholeRange = this.tryConsumeWholeRange(text, pos);

      if (wholeRange) {
        tokens.push(wholeRange.token);
        pos = wholeRange.next;

        continue;
      }

      const numberMatch = matchSticky(this.numberPattern, text, pos);

      if (numberMatch && numberMatch.index === pos) {
        tokens.push({
          type: TokenType.NUMBER,
          value: numberMatch[0],
          start,
          end: start + numberMatch[0].length,
        });
        pos += numberMatch[0].length;

        continue;
      }

      const identMatch = matchSticky(RE_IDENT, text, pos);

      if (identMatch && identMatch.index === pos) {
        const word = identMatch[0];
        const after = pos + word.length;

        if (text.charAt(after) === "(") {
          tokens.push({
            type: TokenType.FUNCTION,
            value: word,
            start,
            end: after,
            meta: { name: word.toUpperCase() },
          });
        } else {
          tokens.push({ type: TokenType.IDENT, value: word, start, end: after });
        }

        pos = after;

        continue;
      }

      if (char === "#") {
        const errorLiteralMatch = matchSticky(RE_ERROR_LITERAL, text, pos);

        if (errorLiteralMatch && errorLiteralMatch.index === pos) {
          tokens.push({
            type: TokenType.ERROR_LITERAL,
            value: errorLiteralMatch[0],
            start,
            end: start + errorLiteralMatch[0].length,
          });
          pos += errorLiteralMatch[0].length;

          continue;
        }
      }

      const commentMatch = matchSticky(RE_COMMENT, text, pos);

      if (commentMatch && commentMatch.index === pos) {
        const value = commentMatch[0];
        const payload = value.replace(/^\/\/\s?/, "");

        tokens.push({
          type: TokenType.COMMENT,
          value,
          start,
          end: start + value.length,
          meta: { text: payload, contextOk: true },
        });
        pos += value.length;

        continue;
      }

      const multiCharOpMatch = matchSticky(RE_OP_MULTI, text, pos);

      if (multiCharOpMatch && multiCharOpMatch.index === pos) {
        tokens.push({
          type: TokenType.OPERATOR,
          value: multiCharOpMatch[0],
          start,
          end: start + multiCharOpMatch[0].length,
        });
        pos += multiCharOpMatch[0].length;

        continue;
      }

      const singleCharOpMatch = matchSticky(RE_OP_SINGLE, text, pos);

      if (singleCharOpMatch && singleCharOpMatch.index === pos) {
        tokens.push({
          type: TokenType.OPERATOR,
          value: singleCharOpMatch[0],
          start,
          end: start + singleCharOpMatch[0].length,
        });
        pos += singleCharOpMatch[0].length;

        continue;
      }

      tokens.push({ type: TokenType.ERROR, value: char, start, end: start + 1 });
      pos++;
    }

    for (const [index, token] of tokens.entries()) {
      if (token.type !== TokenType.COMMENT) {
        continue;
      }

      const prev = nonTrivialAt(tokens, index, -1);
      const next = nonTrivialAt(tokens, index, 1);
      const meta = token.meta as CommentMeta;

      meta.contextOk = isAdditiveOpener(prev) && isAdditiveCloser(next);
    }

    return tokens;
  }
}
