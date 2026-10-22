import { describe, expect, it } from "vitest";
import {
  buildNumberPattern,
  matchCell,
  matchSheetPrefix,
  matchSticky,
} from "../../src/lexer/matchers";

describe("buildNumberPattern", () => {
  it("matches an integer with the dot separator", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, "123", 0)?.[0]).toBe("123");
  });

  it("matches a decimal with the dot separator", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, "1.5", 0)?.[0]).toBe("1.5");
  });

  it("matches a decimal with no integer part", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, ".5", 0)?.[0]).toBe(".5");
  });

  it("matches scientific notation with a signed exponent", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, "1.5e-10", 0)?.[0]).toBe("1.5e-10");
  });

  it("does not match a bare dot separator", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, ".", 0)).toBeNull();
  });

  it("matches a decimal with the comma separator", () => {
    const pattern = buildNumberPattern(",");

    expect(matchSticky(pattern, "1,5", 0)?.[0]).toBe("1,5");
  });

  it("stops at a dot when the separator is a comma", () => {
    const pattern = buildNumberPattern(",");

    expect(matchSticky(pattern, "1.5", 0)?.[0]).toBe("1");
  });

  it("does not match a bare comma separator", () => {
    const pattern = buildNumberPattern(",");

    expect(matchSticky(pattern, ",", 0)).toBeNull();
  });

  it("escapes the dot so it does not act as a regex wildcard", () => {
    const pattern = buildNumberPattern(".");

    expect(matchSticky(pattern, "1x5", 0)?.[0]).toBe("1");
  });
});

describe("matchSticky", () => {
  it("matches when the pattern starts exactly at pos", () => {
    const match = matchSticky(/\d+/y, "AB12", 2);

    expect(match?.[0]).toBe("12");
    expect(match?.index).toBe(2);
  });

  it("returns null when the pattern only occurs after pos", () => {
    expect(matchSticky(/\d+/y, "AB12", 0)).toBeNull();
  });

  it("anchors at pos on repeated calls with the same pattern", () => {
    const pattern = /\d+/y;

    expect(matchSticky(pattern, "12AB", 0)?.[0]).toBe("12");
    expect(matchSticky(pattern, "12AB", 2)).toBeNull();
  });
});

describe("matchCell", () => {
  it("matches a relative A1 reference", () => {
    expect(matchCell("A1", 0)).toEqual({
      text: "A1",
      length: 2,
      meta: { col: 0, row: 0, abs: { col: false, row: false } },
    });
  });

  it("matches a fully absolute $A$1 reference", () => {
    expect(matchCell("$A$1", 0)).toEqual({
      text: "$A$1",
      length: 4,
      meta: { col: 0, row: 0, abs: { col: true, row: true } },
    });
  });

  it("matches a column-absolute $A1 reference", () => {
    const result = matchCell("$A1", 0);

    expect(result?.meta.abs).toEqual({ col: true, row: false });
  });

  it("matches a row-absolute A$1 reference", () => {
    const result = matchCell("A$1", 0);

    expect(result?.meta.abs).toEqual({ col: false, row: true });
  });

  it("matches a lowercase reference and keeps the original text", () => {
    expect(matchCell("b3", 0)).toEqual({
      text: "b3",
      length: 2,
      meta: { col: 1, row: 2, abs: { col: false, row: false } },
    });
  });

  it("resolves multi-letter columns", () => {
    const result = matchCell("AA10", 0);

    expect(result?.meta.col).toBe(26);
    expect(result?.meta.row).toBe(9);
  });

  it("resolves the XFD1048576 corner cell", () => {
    const result = matchCell("XFD1048576", 0);

    expect(result?.meta.col).toBe(16383);
    expect(result?.meta.row).toBe(1048575);
  });

  it("returns null for letters without a row number", () => {
    expect(matchCell("SUM", 0)).toBeNull();
  });

  it("returns null when digits precede the column letters", () => {
    expect(matchCell("1A", 0)).toBeNull();
  });

  it("returns null when the reference starts after pos", () => {
    expect(matchCell("=A1", 0)).toBeNull();
  });

  it("matches a reference in the middle of a formula", () => {
    const result = matchCell("=A1+B2", 4);

    expect(result?.text).toBe("B2");
    expect(result?.meta).toEqual({ col: 1, row: 1, abs: { col: false, row: false } });
  });
});

describe("matchSheetPrefix", () => {
  it("matches an unquoted sheet prefix", () => {
    expect(matchSheetPrefix("Sheet1!A1", 0)).toEqual({ sheet: "Sheet1", length: 7 });
  });

  it("matches a quoted sheet prefix with spaces", () => {
    expect(matchSheetPrefix("'My Sheet'!A1", 0)).toEqual({ sheet: "My Sheet", length: 11 });
  });

  it("unescapes doubled quotes inside a quoted sheet name", () => {
    expect(matchSheetPrefix("'It''s'!A1", 0)).toEqual({ sheet: "It's", length: 8 });
  });

  it("matches a prefix at a mid-string position", () => {
    expect(matchSheetPrefix("=Sheet1!A1", 1)).toEqual({ sheet: "Sheet1", length: 7 });
  });

  it("returns null when the prefix starts after pos", () => {
    expect(matchSheetPrefix("=Sheet1!A1", 0)).toBeNull();
  });

  it("returns null for a name without the trailing bang", () => {
    expect(matchSheetPrefix("Sheet1", 0)).toBeNull();
  });

  it("returns null for an unterminated quoted name", () => {
    expect(matchSheetPrefix("'My Sheet", 0)).toBeNull();
  });

  it("returns null for an unquoted name starting with a digit", () => {
    expect(matchSheetPrefix("1Sheet!A1", 0)).toBeNull();
  });

  it("matches a quoted sheet name ending in a backslash", () => {
    const match = matchSheetPrefix("'x\\'!A1", 0);

    expect(match).toEqual({ sheet: "x\\", length: 5 });
  });

  it("matches a quoted sheet name with an interior backslash as an ordinary character", () => {
    const match = matchSheetPrefix("'a\\b'!A1", 0);

    expect(match).toEqual({ sheet: "a\\b", length: 6 });
  });

  it("no longer treats backslash-quote as an escaped quote", () => {
    expect(matchSheetPrefix("'a\\'b'!A1", 0)).toBeNull();
  });
});
