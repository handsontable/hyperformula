import { describe, expect, it } from "vitest";
import { isAdditiveCloser, isAdditiveOpener, nonTrivialAt } from "../../src/lexer/additiveContext";
import { TokenType } from "../../src/lexer/tokens";
import type { Token } from "../../src/lexer/types";

function token(type: TokenType, value = ""): Token {
  return { type, value, start: 0, end: value.length };
}

describe("isAdditiveOpener", () => {
  it("is false for a missing token", () => {
    expect(isAdditiveOpener(null)).toBe(false);
  });

  it("is true after =, + or - operators", () => {
    expect(isAdditiveOpener(token(TokenType.OPERATOR, "="))).toBe(true);
    expect(isAdditiveOpener(token(TokenType.OPERATOR, "+"))).toBe(true);
    expect(isAdditiveOpener(token(TokenType.OPERATOR, "-"))).toBe(true);
  });

  it("is false after a multiplicative operator", () => {
    expect(isAdditiveOpener(token(TokenType.OPERATOR, "*"))).toBe(false);
  });

  it("is true after a comma or opening paren", () => {
    expect(isAdditiveOpener(token(TokenType.COMMA, ","))).toBe(true);
    expect(isAdditiveOpener(token(TokenType.LPAREN, "("))).toBe(true);
  });

  it("is true after a value or closing paren", () => {
    expect(isAdditiveOpener(token(TokenType.NUMBER, "1"))).toBe(true);
    expect(isAdditiveOpener(token(TokenType.CELL_REF, "A1"))).toBe(true);
    expect(isAdditiveOpener(token(TokenType.RPAREN, ")"))).toBe(true);
  });

  it("is false before a function name", () => {
    expect(isAdditiveOpener(token(TokenType.FUNCTION, "SUM"))).toBe(false);
  });
});

describe("isAdditiveCloser", () => {
  it("is true for a missing token (end of input)", () => {
    expect(isAdditiveCloser(null)).toBe(true);
  });

  it("is true before + or - but not = or *", () => {
    expect(isAdditiveCloser(token(TokenType.OPERATOR, "+"))).toBe(true);
    expect(isAdditiveCloser(token(TokenType.OPERATOR, "-"))).toBe(true);
    expect(isAdditiveCloser(token(TokenType.OPERATOR, "="))).toBe(false);
    expect(isAdditiveCloser(token(TokenType.OPERATOR, "*"))).toBe(false);
  });

  it("is true before a comma, closing paren or comment", () => {
    expect(isAdditiveCloser(token(TokenType.COMMA, ","))).toBe(true);
    expect(isAdditiveCloser(token(TokenType.RPAREN, ")"))).toBe(true);
    expect(isAdditiveCloser(token(TokenType.COMMENT, "// x"))).toBe(true);
  });

  it("is false before a value", () => {
    expect(isAdditiveCloser(token(TokenType.NUMBER, "1"))).toBe(false);
  });
});

describe("nonTrivialAt", () => {
  const tokens = [
    token(TokenType.CELL_REF, "A1"),
    token(TokenType.WHITESPACE, " "),
    token(TokenType.OPERATOR, "+"),
  ];

  it("skips whitespace scanning forward", () => {
    expect(nonTrivialAt(tokens, 0, 1)).toBe(tokens[2]);
  });

  it("skips whitespace scanning backward", () => {
    expect(nonTrivialAt(tokens, 2, -1)).toBe(tokens[0]);
  });

  it("returns null when nothing non-trivial remains", () => {
    expect(nonTrivialAt(tokens, 2, 1)).toBeNull();
  });
});
