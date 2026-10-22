import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";

const nonWs = (lexer: Lexer, source: string) =>
  lexer.tokenize(source).filter((token) => token.type !== TokenType.WHITESPACE);

describe("Lexer array literals", () => {
  const lex = new Lexer();

  it("tokenizes a matrix literal with default separators", () => {
    expect(nonWs(lex, "{1,2;3,4}").map((token) => token.type)).toEqual([
      TokenType.LBRACE,
      TokenType.NUMBER,
      TokenType.COMMA,
      TokenType.NUMBER,
      TokenType.SEMICOLON,
      TokenType.NUMBER,
      TokenType.COMMA,
      TokenType.NUMBER,
      TokenType.RBRACE,
    ]);
  });
});

describe("Lexer configurable separators", () => {
  it("parses a comma decimal separator inside numbers", () => {
    const lexer = new Lexer({ decimalSeparator: ",", argSeparator: ";", arrayRowSeparator: "|" });

    expect(nonWs(lexer, "1,5").map((token) => token.value)).toEqual(["1,5"]);
  });

  it("treats the configured argument separator as a comma token", () => {
    const lexer = new Lexer({ decimalSeparator: ",", argSeparator: ";", arrayRowSeparator: "|" });

    expect(nonWs(lexer, "=SUM(1,5;2,5)").map((token) => token.type)).toEqual([
      TokenType.OPERATOR,
      TokenType.FUNCTION,
      TokenType.LPAREN,
      TokenType.NUMBER,
      TokenType.COMMA,
      TokenType.NUMBER,
      TokenType.RPAREN,
    ]);
  });

  it("uses the configured array row separator for the semicolon token", () => {
    const lexer = new Lexer({ decimalSeparator: ",", argSeparator: ";", arrayRowSeparator: "|" });

    expect(nonWs(lexer, "{1|2}").map((token) => token.type)).toEqual([
      TokenType.LBRACE,
      TokenType.NUMBER,
      TokenType.SEMICOLON,
      TokenType.NUMBER,
      TokenType.RBRACE,
    ]);
  });
});
