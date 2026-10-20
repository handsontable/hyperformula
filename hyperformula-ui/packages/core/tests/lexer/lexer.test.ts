import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";

const lex = new Lexer();
const types = (source: string) =>
  lex
    .tokenize(source)
    .filter((token) => token.type !== TokenType.WHITESPACE)
    .map((token) => token.type);
const values = (source: string) =>
  lex
    .tokenize(source)
    .filter((token) => token.type !== TokenType.WHITESPACE)
    .map((token) => token.value);

describe("Lexer", () => {
  it("numbers (int / float / scientific)", () => {
    expect(values("1 2.5 3.1e10 4E-3")).toEqual(["1", "2.5", "3.1e10", "4E-3"]);
    expect(types("1 2.5 3.1e10 4E-3")).toEqual([
      TokenType.NUMBER,
      TokenType.NUMBER,
      TokenType.NUMBER,
      TokenType.NUMBER,
    ]);
  });

  it("strings with backslash-escaped quotes (HyperFormula grammar)", () => {
    expect(values('"hello" "with \\"quote\\""')).toEqual(['"hello"', '"with \\"quote\\""']);
  });

  it("doubled quotes are two adjacent strings, not an escape", () => {
    expect(values('"a""b"')).toEqual(['"a"', '"b"']);
  });

  it("strings keep backslash-escaped characters verbatim", () => {
    expect(values('"a\\b"')).toEqual(['"a\\b"']);
  });

  it("an unterminated string makes every quote after it an error", () => {
    expect(values('="a\\"b\\"c')).toEqual(["=", '"', "a", "\\", '"', "b", "\\", '"', "c"]);
    expect(types('="a\\"b\\"c').filter((type) => type === TokenType.ERROR)).toHaveLength(5);
    expect(values('="x" & "y')).toEqual(["=", '"x"', "&", '"', "y"]);
  });

  it("cell cellRefs absolute markers", () => {
    const tokens = lex.tokenize("A1 $A1 A$1 $A$1");
    const cellRefs = tokens.filter((token) => token.type === TokenType.CELL_REF);

    expect(cellRefs.map((ref) => ref.value)).toEqual(["A1", "$A1", "A$1", "$A$1"]);
    expect(
      cellRefs.map((ref) => (ref.meta as { abs: { col: boolean; row: boolean } }).abs),
    ).toEqual([
      { col: false, row: false },
      { col: true, row: false },
      { col: false, row: true },
      { col: true, row: true },
    ]);
  });

  it("ranges", () => {
    const tokens = lex.tokenize("A1:B5");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.RANGE_REF);
    expect(tokens[0]?.value).toBe("A1:B5");
  });

  it("lowercase and mixed-case cell refs tokenize case-insensitively", () => {
    const tokens = lex.tokenize("a1 $bc2 De$3");
    const cellRefs = tokens.filter((token) => token.type === TokenType.CELL_REF);

    expect(cellRefs.map((ref) => ref.value)).toEqual(["a1", "$bc2", "De$3"]);
    expect(cellRefs.map((ref) => (ref.meta as { col: number; row: number }).col)).toEqual([
      0, 54, 108,
    ]);
    expect(cellRefs.map((ref) => (ref.meta as { col: number; row: number }).row)).toEqual([
      0, 1, 2,
    ]);
  });

  it("lowercase ranges and whole-column ranges tokenize", () => {
    expect(types("a1:b5")).toEqual([TokenType.RANGE_REF]);
    expect(types("a:b")).toEqual([TokenType.RANGE_REF]);
  });

  it("sheet-qualified cellRefs (bare)", () => {
    const tokens = lex.tokenize("Sheet2!A1");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.CELL_REF);
    expect((tokens[0]?.meta as { sheet: string }).sheet).toBe("Sheet2");
  });

  it("sheet-qualified cellRefs (quoted with spaces)", () => {
    const tokens = lex.tokenize("'My Sheet'!A1:B2");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.RANGE_REF);
    expect((tokens[0]?.meta as { sheet: string }).sheet).toBe("My Sheet");
  });

  it("function detection requires trailing paren", () => {
    expect(lex.tokenize("SUM(").map((token) => token.type)).toEqual([
      TokenType.FUNCTION,
      TokenType.LPAREN,
    ]);
    expect(lex.tokenize("SUM").map((token) => token.type)).toEqual([TokenType.IDENT]);
  });

  it("cell-shaped function names lex as FUNCTION, not CELL_REF", () => {
    expect(lex.tokenize("LOG10(2)").map((token) => token.type)).toEqual([
      TokenType.FUNCTION,
      TokenType.LPAREN,
      TokenType.NUMBER,
      TokenType.RPAREN,
    ]);
    expect(lex.tokenize("log10(2)")[0]?.type).toBe(TokenType.FUNCTION);
    expect(lex.tokenize("atan2(1,1)")[0]?.type).toBe(TokenType.FUNCTION);
    expect(lex.tokenize("A1")[0]?.type).toBe(TokenType.CELL_REF);
  });

  it("localized (non-ASCII) function and identifier names", () => {
    expect(types("RÉPÉTER(")).toEqual([TokenType.FUNCTION, TokenType.LPAREN]);
    expect(types("ОКРУГЛ(")).toEqual([TokenType.FUNCTION, TokenType.LPAREN]);
    expect(types("Provgröße")).toEqual([TokenType.IDENT]);
  });

  it("non-ASCII bare sheet names", () => {
    const tokens = lex.tokenize("Ärgebnis!A1");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.CELL_REF);
    expect((tokens[0]?.meta as { sheet: string }).sheet).toBe("Ärgebnis");
  });

  it("whole-column and whole-row ranges", () => {
    for (const source of ["A:A", "A:C", "$A:$A", "1:1", "2:5", "$1:$1"]) {
      const tokens = lex.tokenize(source);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.type).toBe(TokenType.RANGE_REF);
      expect(tokens[0]?.value).toBe(source);
    }
  });

  it("whole-column range carries column bounds and a whole marker", () => {
    const tokens = lex.tokenize("A:C");
    const meta = tokens[0]?.meta as {
      whole?: string;
      start: { col: number };
      end: { col: number };
    };

    expect(meta.whole).toBe("column");
    expect(meta.start.col).toBe(0);
    expect(meta.end.col).toBe(2);
  });

  it("sheet-qualified whole-column range", () => {
    const tokens = lex.tokenize("Sheet1!A:A");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.RANGE_REF);
    expect((tokens[0]?.meta as { sheet: string }).sheet).toBe("Sheet1");
    expect((tokens[0]?.meta as { whole: string }).whole).toBe("column");
  });

  it("does not mistake a cell range for a whole range", () => {
    const tokens = lex.tokenize("A1:B2");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.RANGE_REF);
    expect((tokens[0]?.meta as { whole?: string }).whole).toBeUndefined();
  });

  it("operators single + multi", () => {
    expect(values("a<=b<>c>=d")).toEqual(["a", "<=", "b", "<>", "c", ">=", "d"]);
  });

  it("TRUE / FALSE tokenize as identifiers (HyperFormula has no boolean literal)", () => {
    expect(types("TRUE FALSE")).toEqual([TokenType.IDENT, TokenType.IDENT]);
    expect(types("TRUE()")).toEqual([TokenType.FUNCTION, TokenType.LPAREN, TokenType.RPAREN]);
  });

  it("a space between two refs stays whitespace (HyperFormula has no intersection operator)", () => {
    expect(lex.tokenize("A1 B2").map((token) => token.type)).toEqual([
      TokenType.CELL_REF,
      TokenType.WHITESPACE,
      TokenType.CELL_REF,
    ]);
  });

  it("error literals that HyperFormula accepts in formulas", () => {
    const literals = [
      "#REF!",
      "#N/A",
      "#DIV/0!",
      "#NAME?",
      "#NUM!",
      "#VALUE!",
      "#ERROR!",
      "#CYCLE!",
      "#SPILL!",
    ];

    for (const literal of literals) {
      const tokens = lex.tokenize(literal);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.type).toBe(TokenType.ERROR_LITERAL);
      expect(tokens[0]?.value).toBe(literal);
    }
  });

  it("error literal inside a function call", () => {
    expect(types("=IFERROR(A1,#N/A)")).toEqual([
      TokenType.OPERATOR,
      TokenType.FUNCTION,
      TokenType.LPAREN,
      TokenType.CELL_REF,
      TokenType.COMMA,
      TokenType.ERROR_LITERAL,
      TokenType.RPAREN,
    ]);
  });

  it("error fallback", () => {
    const tokens = lex.tokenize("@");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.ERROR);
  });

  it("preserves offsets", () => {
    const tokens = lex.tokenize("=SUM(A1, B2)");

    for (const token of tokens) {
      expect(token.value).toBe("=SUM(A1, B2)".slice(token.start, token.end));
    }
  });

  it("complex formula", () => {
    const tokens = lex.tokenize('=IF(SUM(A1:B5)>100,"big",AVG)');
    const tokenTypes = tokens
      .filter((token) => token.type !== TokenType.WHITESPACE)
      .map((token) => token.type);

    expect(tokenTypes).toEqual([
      TokenType.OPERATOR,
      TokenType.FUNCTION,
      TokenType.LPAREN,
      TokenType.FUNCTION,
      TokenType.LPAREN,
      TokenType.RANGE_REF,
      TokenType.RPAREN,
      TokenType.OPERATOR,
      TokenType.NUMBER,
      TokenType.COMMA,
      TokenType.STRING,
      TokenType.COMMA,
      TokenType.IDENT,
      TokenType.RPAREN,
    ]);
  });
});
