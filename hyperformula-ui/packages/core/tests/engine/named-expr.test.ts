import { describe, expect, it } from "vitest";
import { annotateNamedExprs } from "../../src/engine/namedExpr";
import type { NamedExprResolution } from "../../src/engine/types";
import { TokenType } from "../../src/lexer/tokens";
import type { Token } from "../../src/lexer/types";

function ident(value: string, start: number): Token {
  return { type: TokenType.IDENT, value, start, end: start + value.length };
}

const resolve = (name: string): NamedExprResolution | null => {
  if (name === "SalesRange") {
    return {
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 0, row: 9 } },
    };
  }

  return null;
};

describe("annotateNamedExprs", () => {
  it("rewrites a matching IDENT into a NAMED_EXPR token with meta", () => {
    const result = annotateNamedExprs([ident("SalesRange", 1)], resolve);

    expect(result[0]?.type).toBe(TokenType.NAMED_EXPR);
    expect(result[0]?.meta).toEqual({
      named: true,
      kind: "range",
      sheet: "Sheet1",
      range: { start: { col: 0, row: 0 }, end: { col: 0, row: 9 } },
    });
  });

  it("leaves an unmatched IDENT untouched", () => {
    const original = ident("Unknown", 1);
    const result = annotateNamedExprs([original], resolve);

    expect(result[0]).toBe(original);
    expect(result[0]?.type).toBe(TokenType.IDENT);
  });

  it("ignores non-IDENT tokens", () => {
    const functionToken: Token = { type: TokenType.FUNCTION, value: "SUM", start: 0, end: 3 };
    const result = annotateNamedExprs([functionToken], resolve);

    expect(result[0]).toBe(functionToken);
  });
});
