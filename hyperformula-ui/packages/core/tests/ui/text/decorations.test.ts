import { describe, expect, it } from "vitest";
import { Lexer } from "../../../src/lexer/lexer";
import { computeDecorations } from "../../../src/ui/text/decorations";

const lex = new Lexer();

describe("computeDecorations — paren depth", () => {
  it("assigns depth 0 to a single paren pair", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 0);

    expect(decorations.parenDepth.get(2)).toBe(0);
    expect(decorations.parenDepth.get(6)).toBe(0);
  });

  it("increments depth for nested parens", () => {
    const tokens = lex.tokenize("=SUM(IF(A1,1),2)");
    const decorations = computeDecorations(tokens, 0);

    expect(decorations.parenDepth.get(2)).toBe(0);
    expect(decorations.parenDepth.get(4)).toBe(1);
    expect(decorations.parenDepth.get(8)).toBe(1);
    expect(decorations.parenDepth.get(11)).toBe(0);
  });

  it("does not throw on a stray closing paren", () => {
    const tokens = lex.tokenize("=SUM(1))");

    expect(() => computeDecorations(tokens, 0)).not.toThrow();
  });
});

describe("computeDecorations — matching paren", () => {
  it("matches the pair when caret is just after the open paren", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 5);

    expect(decorations.matchPair).toEqual([2, 6]);
  });

  it("matches the pair when caret is just before the close paren", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 8);

    expect(decorations.matchPair).toEqual([2, 6]);
  });

  it("returns null for an unmatched open paren", () => {
    const tokens = lex.tokenize("=SUM(1");
    const decorations = computeDecorations(tokens, 5);

    expect(decorations.matchPair).toBeNull();
  });

  it("returns null when caret is not adjacent to any paren", () => {
    const tokens = lex.tokenize("=SUM(1,2)");

    expect(computeDecorations(tokens, 6).matchPair).toBeNull();
  });
});

describe("computeDecorations — active function range", () => {
  it("spans from the function name to its closing paren", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 6);

    expect(decorations.activeRange).toEqual([1, 6]);
  });

  it("targets the innermost enclosing function only", () => {
    const tokens = lex.tokenize("=SUM(IF(A1,1),2)");
    const decorations = computeDecorations(tokens, 9);

    expect(decorations.activeRange).toEqual([3, 8]);
  });

  it("extends to the last token when the function paren is unclosed", () => {
    const tokens = lex.tokenize("=SUM(1");
    const decorations = computeDecorations(tokens, 6);

    expect(decorations.activeRange).toEqual([1, 3]);
  });

  it("is null when the caret is outside any function", () => {
    const tokens = lex.tokenize("=1+2");
    const decorations = computeDecorations(tokens, 2);

    expect(decorations.activeRange).toBeNull();
  });
});

describe("computeDecorations — current argument", () => {
  it("spans the first argument when caret sits in it", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 6);

    expect(decorations.argRange).toEqual([3, 3]);
  });

  it("spans the second argument when caret sits in it", () => {
    const tokens = lex.tokenize("=SUM(1,2)");
    const decorations = computeDecorations(tokens, 8);

    expect(decorations.argRange).toEqual([5, 5]);
  });

  it("uses the innermost function's argument boundaries", () => {
    const tokens = lex.tokenize("=SUM(IF(A1,1),2)");
    const decorations = computeDecorations(tokens, 9);

    expect(decorations.argRange).toEqual([5, 5]);
  });
});
