import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";

const nonWs = (lexer: Lexer, source: string) =>
  lexer.tokenize(source).filter((token) => token.type !== TokenType.WHITESPACE);

const types = (lexer: Lexer, source: string) => nonWs(lexer, source).map((token) => token.type);

describe("Lexer reference limits", () => {
  const lex = new Lexer();

  it("lexes '=CONCATENATEA1' as an identifier, not a cell reference", () => {
    expect(nonWs(lex, "=CONCATENATEA1").map(({ type, value }) => ({ type, value }))).toEqual([
      { type: TokenType.OPERATOR, value: "=" },
      { type: TokenType.IDENT, value: "CONCATENATEA1" },
    ]);
  });

  it("lexes '=A9999999999999999' as an identifier, not a cell reference", () => {
    expect(types(lex, "=A9999999999999999")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
  });

  it("keeps '=A1', '=ZZZ1' and '=A40000' as cell references with the default limits", () => {
    expect(types(lex, "=A1")).toEqual([TokenType.OPERATOR, TokenType.CELL_REF]);
    expect(types(lex, "=ZZZ1")).toEqual([TokenType.OPERATOR, TokenType.CELL_REF]);
    expect(types(lex, "=A40000")).toEqual([TokenType.OPERATOR, TokenType.CELL_REF]);
  });

  it("lexes '=AAAA1' and '=A40001' as identifiers with the default limits", () => {
    expect(types(lex, "=AAAA1")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
    expect(types(lex, "=A40001")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
  });

  it("moves the limit with custom maxColumns and maxRows", () => {
    const small = new Lexer({ maxColumns: 2, maxRows: 10 });

    expect(types(small, "=B10")).toEqual([TokenType.OPERATOR, TokenType.CELL_REF]);
    expect(types(small, "=C1")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
    expect(types(small, "=A11")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);

    const large = new Lexer({ maxColumns: 16_384, maxRows: 1_048_576 });

    expect(types(large, "=A1048576")).toEqual([TokenType.OPERATOR, TokenType.CELL_REF]);
    expect(types(large, "=A1048577")).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
  });

  it("does not lex '=AA1:ZZZZZZZ1' as a range reference", () => {
    expect(types(lex, "=AA1:ZZZZZZZ1")).toEqual([
      TokenType.OPERATOR,
      TokenType.CELL_REF,
      TokenType.OPERATOR,
      TokenType.IDENT,
    ]);
  });

  it("does not lex a range whose start is past the limit as a range reference", () => {
    const tokens = types(lex, "=A40001:A2");

    expect(tokens).not.toContain(TokenType.RANGE_REF);
    expect(tokens.slice(0, 2)).toEqual([TokenType.OPERATOR, TokenType.IDENT]);
  });

  it("does not lex a sheet-qualified reference past the limit as a cell or range reference", () => {
    expect(types(lex, "=Sheet1!A40001")).not.toContain(TokenType.CELL_REF);
    expect(types(lex, "=Sheet1!A1:ZZZZ1")).not.toContain(TokenType.RANGE_REF);
  });

  it("does not lex a whole-column range past maxColumns as a range reference", () => {
    expect(types(lex, "=A:ZZZ")).toEqual([TokenType.OPERATOR, TokenType.RANGE_REF]);
    expect(types(lex, "=A:AAAA")).not.toContain(TokenType.RANGE_REF);
  });

  it("does not lex a whole-row range past maxRows as a range reference", () => {
    expect(types(lex, "=1:40000")).toEqual([TokenType.OPERATOR, TokenType.RANGE_REF]);
    expect(types(lex, "=1:40001")).not.toContain(TokenType.RANGE_REF);
  });
});
