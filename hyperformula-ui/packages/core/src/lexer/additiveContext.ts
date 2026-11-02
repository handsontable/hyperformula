import { TokenType } from "./tokens";
import type { Token } from "./types";

export function isAdditiveOpener(token: Token | null): boolean {
  if (!token) {
    return false;
  }

  if (
    token.type === TokenType.OPERATOR &&
    (token.value === "=" || token.value === "+" || token.value === "-")
  ) {
    return true;
  }

  if (token.type === TokenType.COMMA || token.type === TokenType.LPAREN) {
    return true;
  }

  if (token.type === TokenType.COMMENT) {
    return true;
  }

  return (
    token.type === TokenType.NUMBER ||
    token.type === TokenType.CELL_REF ||
    token.type === TokenType.RANGE_REF ||
    token.type === TokenType.STRING ||
    token.type === TokenType.RPAREN
  );
}

export function isAdditiveCloser(token: Token | null): boolean {
  if (!token) {
    return true;
  }

  if (token.type === TokenType.OPERATOR && (token.value === "+" || token.value === "-")) {
    return true;
  }

  if (token.type === TokenType.COMMA || token.type === TokenType.RPAREN) {
    return true;
  }

  if (token.type === TokenType.COMMENT) {
    return true;
  }

  return false;
}

export function nonTrivialAt(tokens: Token[], startIndex: number, direction: -1 | 1): Token | null {
  for (
    let index = startIndex + direction;
    index >= 0 && index < tokens.length;
    index += direction
  ) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (token.type !== TokenType.WHITESPACE) {
      return token;
    }
  }

  return null;
}
