import { describe, expect, it } from "vitest";
import { formatRef, formatWholeRef } from "../../src/adapter/refFormat";
import type { CellAddress, CellRange, HeaderPick } from "../../src/adapter/types";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";
import type { RangeRefMeta } from "../../src/lexer/types";

function cell(col: number, row: number, sheet = ""): CellAddress {
  return { sheet, col, row };
}

describe("formatRef", () => {
  it("formats a sheetless cell as A1 notation", () => {
    expect(formatRef(cell(0, 0))).toBe("A1");
  });

  it("converts a multi-letter column index", () => {
    expect(formatRef(cell(26, 4))).toBe("AA5");
  });

  it("prefixes a bare-identifier sheet name unquoted", () => {
    expect(formatRef(cell(0, 0, "Sheet1"))).toBe("Sheet1!A1");
  });

  it("quotes a sheet name containing a space", () => {
    expect(formatRef(cell(0, 0, "My Sheet"))).toBe("'My Sheet'!A1");
  });

  it("doubles an apostrophe inside a quoted sheet name", () => {
    expect(formatRef(cell(0, 0, "Bob's"))).toBe("'Bob''s'!A1");
  });

  it("lexer accepts a formatted ref whose sheet name ends in a backslash", () => {
    const ref = formatRef(cell(0, 0, "x\\"));
    const lex = new Lexer();
    const tokens = lex.tokenize(`=${ref}`);
    const cellTokens = tokens.filter((token) => token.type === TokenType.CELL_REF);

    expect(ref).toBe("'x\\'!A1");
    expect(cellTokens).toHaveLength(1);
  });

  it("formats a range as start:end with the sheet only on the start", () => {
    const range: CellRange = { start: cell(0, 0, "Sheet1"), end: cell(2, 3, "Sheet1") };

    expect(formatRef(range)).toBe("Sheet1!A1:C4");
  });
});

describe("formatWholeRef", () => {
  it("formats a whole-column pick as letters lo:hi", () => {
    const pick: HeaderPick = { axis: "column", sheet: "", start: 2, end: 0, append: false };

    expect(formatWholeRef(pick)).toBe("A:C");
  });

  it("formats a whole-row pick 1-based", () => {
    const pick: HeaderPick = { axis: "row", sheet: "", start: 3, end: 3, append: false };

    expect(formatWholeRef(pick)).toBe("4:4");
  });

  it("formats a whole-column pick with normalized start/end", () => {
    const pick: HeaderPick = { axis: "column", sheet: "", start: 0, end: 2, append: false };

    expect(formatWholeRef(pick)).toBe("A:C");
  });

  it("prefixes a bare-identifier sheet name unquoted", () => {
    const pick: HeaderPick = { axis: "column", sheet: "Sheet1", start: 0, end: 2, append: false };

    expect(formatWholeRef(pick)).toBe("Sheet1!A:C");
  });

  it("quotes a sheet name containing a space", () => {
    const pick: HeaderPick = { axis: "column", sheet: "My Sheet", start: 0, end: 2, append: false };

    expect(formatWholeRef(pick)).toBe("'My Sheet'!A:C");
  });

  it("lexer accepts the produced whole-column ref as a RANGE_REF", () => {
    const pick: HeaderPick = { axis: "column", sheet: "Sheet1", start: 0, end: 2, append: false };
    const ref = formatWholeRef(pick);
    const lex = new Lexer();
    const tokens = lex.tokenize(`=${ref}`);
    const rangeTokens = tokens.filter((token) => token.type === TokenType.RANGE_REF);

    expect(rangeTokens).toHaveLength(1);
    expect((rangeTokens[0]?.meta as RangeRefMeta).whole).toBe("column");
  });

  it("lexer accepts the produced whole-row ref as a RANGE_REF", () => {
    const pick: HeaderPick = { axis: "row", sheet: "", start: 3, end: 3, append: false };
    const ref = formatWholeRef(pick);
    const lex = new Lexer();
    const tokens = lex.tokenize(`=${ref}`);
    const rangeTokens = tokens.filter((token) => token.type === TokenType.RANGE_REF);

    expect(rangeTokens).toHaveLength(1);
    expect((rangeTokens[0]?.meta as RangeRefMeta).whole).toBe("row");
  });
});
