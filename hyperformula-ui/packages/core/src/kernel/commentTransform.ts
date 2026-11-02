import { isAdditiveCloser, isAdditiveOpener, nonTrivialAt } from "../lexer/additiveContext";
import { Lexer } from "../lexer/lexer";
import { TokenType } from "../lexer/tokens";
import type { CommentMeta, LexerOptions, Token } from "../lexer/types";

const lexerCache = new Map<string, Lexer>();

function lexerCacheKey(lexerOptions: Partial<LexerOptions> | undefined): string {
  if (!lexerOptions) {
    return "";
  }

  return JSON.stringify([
    lexerOptions.decimalSeparator,
    lexerOptions.argSeparator,
    lexerOptions.arrayColumnSeparator,
    lexerOptions.arrayRowSeparator,
  ]);
}

function getLexer(lexerOptions: Partial<LexerOptions> | undefined): Lexer {
  const key = lexerCacheKey(lexerOptions);
  const cached = lexerCache.get(key);

  if (cached) {
    return cached;
  }

  const lexer = new Lexer(lexerOptions);

  lexerCache.set(key, lexer);

  return lexer;
}

export function commentsToN(src: string, lexerOptions?: Partial<LexerOptions>): string {
  if (!src.startsWith("=") || !src.includes("//")) {
    return src;
  }

  const tokens = getLexer(lexerOptions).tokenize(src);
  let out = "";
  let cursor = 0;

  for (const token of tokens) {
    if (token.type !== TokenType.COMMENT) {
      continue;
    }

    const meta = token.meta as CommentMeta;

    out += src.slice(cursor, token.start);

    if (!meta.contextOk) {
      cursor = token.start;

      continue;
    }

    const escapedText = meta.text.replace(/[\\"]/g, "\\$&");

    out += `+ N("${escapedText}")`;
    cursor = token.end;
  }

  out += src.slice(cursor);

  return out;
}

interface NWindow {
  start: number;
  end: number;
  payload: string;
}

function nextNonWhitespace(tokens: Token[], startIndex: number): number {
  let index = startIndex;

  while (index < tokens.length && tokens[index]?.type === TokenType.WHITESPACE) {
    index++;
  }

  return index;
}

function findNWindows(tokens: Token[]): NWindow[] {
  const windows: NWindow[] = [];
  let lastWindowEndIndex = -1;

  for (let index = 0; index < tokens.length; index++) {
    const operatorToken = tokens[index];
    if (!operatorToken || operatorToken.type !== TokenType.OPERATOR) {
      continue;
    }

    if (operatorToken.value !== "+" && operatorToken.value !== "-") {
      continue;
    }

    const functionIndex = nextNonWhitespace(tokens, index + 1);
    const functionToken = tokens[functionIndex];

    if (!functionToken || functionToken.type !== TokenType.FUNCTION) {
      continue;
    }

    const functionName = (functionToken.meta as { name?: string } | undefined)?.name;

    if (functionName !== "N") {
      continue;
    }

    const leftParenIndex = functionIndex + 1;
    const leftParenToken = tokens[leftParenIndex];

    if (!leftParenToken || leftParenToken.type !== TokenType.LPAREN) {
      continue;
    }

    const stringIndex = nextNonWhitespace(tokens, leftParenIndex + 1);
    const stringToken = tokens[stringIndex];

    if (!stringToken || stringToken.type !== TokenType.STRING) {
      continue;
    }

    const rightParenIndex = nextNonWhitespace(tokens, stringIndex + 1);
    const rightParenToken = tokens[rightParenIndex];

    if (!rightParenToken || rightParenToken.type !== TokenType.RPAREN) {
      continue;
    }

    let previousToken = nonTrivialAt(tokens, index, -1);

    if (previousToken && lastWindowEndIndex >= 0 && previousToken === tokens[lastWindowEndIndex]) {
      previousToken = nonTrivialAt(tokens, lastWindowEndIndex, -1);
    }

    const followingToken = nonTrivialAt(tokens, rightParenIndex, 1);

    if (!isAdditiveOpener(previousToken) || !isAdditiveCloser(followingToken)) {
      continue;
    }

    const payload = stringToken.value.slice(1, -1).replace(/\\([\\"])/g, "$1");

    windows.push({ start: operatorToken.start, end: rightParenToken.end, payload });
    lastWindowEndIndex = rightParenIndex;
    index = rightParenIndex;
  }

  return windows;
}

function needsLineTerminator(src: string, pos: number): boolean {
  if (pos >= src.length) {
    return false;
  }

  for (let index = pos; index < src.length; index++) {
    const char = src.charAt(index);

    if (char === "\n") {
      return false;
    }

    if (char !== " " && char !== "\t" && char !== "\r") {
      return true;
    }
  }

  return false;
}

const N_CALL_PATTERN = /\bN\s*\(/i;

export function nToComments(src: string, lexerOptions?: Partial<LexerOptions>): string {
  if (!src.startsWith("=") || !N_CALL_PATTERN.test(src)) {
    return src;
  }

  const tokens = getLexer(lexerOptions).tokenize(src);
  const windows = findNWindows(tokens);

  if (windows.length === 0) {
    return src;
  }

  let out = "";
  let cursor = 0;

  for (const window of windows) {
    out += src.slice(cursor, window.start);
    out += `// ${window.payload}`;

    if (needsLineTerminator(src, window.end)) {
      out += "\n";
    }

    cursor = window.end;
  }

  out += src.slice(cursor);

  return out;
}
