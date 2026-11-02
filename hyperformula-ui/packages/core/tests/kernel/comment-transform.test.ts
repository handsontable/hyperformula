import { describe, expect, it } from "vitest";
import { commentsToN, nToComments } from "../../src/kernel/commentTransform";

describe("commentsToN", () => {
  it("converts simple '// note' to '+ N(\"note\")'", () => {
    expect(commentsToN("=A1 // note")).toBe('=A1 + N("note")');
  });

  it("preserves surrounding whitespace and newlines", () => {
    expect(commentsToN("=A1\n// note\n+ B1")).toBe('=A1\n+ N("note")\n+ B1');
  });

  it("escapes internal double quotes with a backslash (HyperFormula grammar)", () => {
    expect(commentsToN('=A1 // say "hi"')).toBe('=A1 + N("say \\"hi\\"")');
  });

  it("escapes backslashes by doubling them", () => {
    expect(commentsToN("=A1 // path\\to")).toBe('=A1 + N("path\\\\to")');
  });

  it("converts an empty comment to '+ N(\"\")'", () => {
    expect(commentsToN("=A1 //")).toBe('=A1 + N("")');
  });

  it("leaves formulas without comments untouched", () => {
    expect(commentsToN("=ROUND(B2 * C2, 2)")).toBe("=ROUND(B2 * C2, 2)");
  });

  it("handles multiple comments in one formula", () => {
    expect(commentsToN("=A1 // a\n+ B1 // b\n+ C1")).toBe('=A1 + N("a")\n+ B1 + N("b")\n+ C1');
  });

  it("does not transform '//' inside string literals", () => {
    expect(commentsToN('=A1 + "x//y"')).toBe('=A1 + "x//y"');
  });
});

describe("nToComments", () => {
  it("converts '+ N(\"x\")' in additive context to '// x'", () => {
    expect(nToComments('=A1 + N("x")')).toBe("=A1 // x");
  });

  it("treats '- N(\"x\")' the same (no-op zero)", () => {
    expect(nToComments('=A1 - N("x")')).toBe("=A1 // x");
  });

  it("unescapes backslash-escaped internal quotes", () => {
    expect(nToComments('=A1 + N("say \\"hi\\"")')).toBe('=A1 // say "hi"');
  });

  it("unescapes doubled backslashes", () => {
    expect(nToComments('=A1 + N("path\\\\to")')).toBe("=A1 // path\\to");
  });

  it("leaves unrecognized escape pairs verbatim in the comment", () => {
    expect(nToComments('=A1 + N("a\\nb")')).toBe("=A1 // a\\nb");
  });

  it("round-trips comments containing quotes and backslashes", () => {
    const src = '=A1 // say "hi" via path\\to';

    expect(nToComments(commentsToN(src))).toBe(src);
  });

  it("leaves non-formula text untouched", () => {
    expect(nToComments('1 + N("hi")')).toBe('1 + N("hi")');
  });

  it("transforms multiple N() comments", () => {
    expect(nToComments('=A1 + N("a")\n+ B1 + N("b")\n+ C1')).toBe("=A1 // a\n+ B1 // b\n+ C1");
  });

  it("leaves N(cellRef) untouched (non-string arg is not a comment)", () => {
    expect(nToComments("=A1 + N(B1)")).toBe("=A1 + N(B1)");
  });

  it('leaves N("x", 0) untouched (extra arg)', () => {
    expect(nToComments('=A1 + N("x", 0)')).toBe('=A1 + N("x", 0)');
  });

  it("is case-insensitive on N()", () => {
    expect(nToComments('=A1 + n("x")')).toBe("=A1 // x");
  });

  it("round-trip: commentsToN ∘ nToComments stable on canonical form", () => {
    const src = "=A1 // price\n+ B2 // qty";
    const persisted = commentsToN(src);
    const reloaded = nToComments(persisted);

    expect(reloaded).toBe(src);
  });

  it("inserts newline so trailing same-line operator survives", () => {
    expect(nToComments('=A1 + N("a") + B1')).toBe("=A1 // a\n + B1");
  });

  it("inserts newline between consecutive same-line N() comments", () => {
    expect(nToComments('=A1 + N("a") + N("b")')).toBe("=A1 // a\n // b");
  });

  it("comment + following-op round-trip stays semantically intact", () => {
    const persisted = '=A1 + N("a") + B1';
    const reloaded = nToComments(persisted);
    const reSerialized = commentsToN(reloaded);

    expect(reSerialized).toBe('=A1 + N("a")\n + B1');
  });
});

describe("fast-path bails", () => {
  it("commentsToN returns the same string unchanged when there is no '//'", () => {
    const inputs = [
      "=ROUND(B2 * C2, 2)",
      '=A1 + N("already a comment")',
      "=SUM(A1:A10)",
      "plain text, no leading =",
    ];

    for (const input of inputs) {
      expect(commentsToN(input)).toBe(input);
    }
  });

  it("nToComments returns the same string unchanged when there is no N( pattern", () => {
    const inputs = [
      "=A1 // note",
      "=ROUND(B2 * C2, 2)",
      "=SUM(A1:A10)",
      "plain text, no leading =",
    ];

    for (const input of inputs) {
      expect(nToComments(input)).toBe(input);
    }
  });

  it("cached lexer stays correct across interleaved calls with two different separator configs", () => {
    const PL_SEPARATORS = {
      decimalSeparator: ",",
      argSeparator: ";",
      arrayColumnSeparator: ",",
      arrayRowSeparator: "|",
    };

    expect(commentsToN("=A1 // note")).toBe('=A1 + N("note")');
    expect(commentsToN("=SUMA(A1 // nota\n; B1)", PL_SEPARATORS)).toBe(
      '=SUMA(A1 + N("nota")\n; B1)',
    );
    expect(commentsToN("=A1 // note again")).toBe('=A1 + N("note again")');
    expect(commentsToN("=SUMA(A1 // druga\n; B1)", PL_SEPARATORS)).toBe(
      '=SUMA(A1 + N("druga")\n; B1)',
    );

    expect(nToComments('=A1 + N("note")')).toBe("=A1 // note");
    expect(nToComments('=SUMA(A1 + N("nota"); B1)', PL_SEPARATORS)).toBe("=SUMA(A1 // nota\n; B1)");
    expect(nToComments('=A1 + N("note again")')).toBe("=A1 // note again");
    expect(nToComments('=SUMA(A1 + N("druga"); B1)', PL_SEPARATORS)).toBe(
      "=SUMA(A1 // druga\n; B1)",
    );
  });
});

describe("locale-aware separators", () => {
  const PL_SEPARATORS = {
    decimalSeparator: ",",
    argSeparator: ";",
    arrayColumnSeparator: ",",
    arrayRowSeparator: "|",
  };

  it("commentsToN treats a ';' arg separator as a valid comment context", () => {
    expect(commentsToN("=SUMA(A1 // nota\n; B1)", PL_SEPARATORS)).toBe(
      '=SUMA(A1 + N("nota")\n; B1)',
    );
  });

  it("nToComments restores a comment followed by a ';' arg separator", () => {
    expect(nToComments('=SUMA(A1 + N("nota"); B1)', PL_SEPARATORS)).toBe("=SUMA(A1 // nota\n; B1)");
  });

  it("round-trips under locale separators", () => {
    const src = "=SUMA(A1 // nota\n; B1)";

    expect(nToComments(commentsToN(src, PL_SEPARATORS), PL_SEPARATORS)).toBe(src);
  });
});
