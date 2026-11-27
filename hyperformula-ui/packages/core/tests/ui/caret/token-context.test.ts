import { describe, expect, it } from "vitest";
import { Lexer } from "../../../src/lexer/lexer";
import { currentFunctionPrefix } from "../../../src/ui/caret/tokenContext";

const lex = new Lexer();

function lexAtCaret(marked: string) {
  const offset = marked.indexOf("|");

  return { offset, tokens: lex.tokenize(marked.slice(0, offset) + marked.slice(offset + 1)) };
}

describe("currentFunctionPrefix", () => {
  it("detects mid-identifier prefix", () => {
    const text = "=SU";
    const tokens = lex.tokenize(text);
    const prefixContext = currentFunctionPrefix(tokens, 3);

    expect(prefixContext).not.toBeNull();
    expect(prefixContext?.prefix).toBe("SU");
    expect(prefixContext?.start).toBe(1);
  });

  it("returns null inside non-ident token", () => {
    const text = "=1+2";
    const tokens = lex.tokenize(text);

    expect(currentFunctionPrefix(tokens, 3)).toBeNull();
  });

  it.each([
    ["=S|()A1", "S", 1],
    ["=S|(A1)", "S", 1],
    ["=S|+A1", "S", 1],
    ["=SUM(S|,A1)", "S", 5],
    ["=SUM(A1,S|)", "S", 8],
    ["=S| A1", "S", 1],
    ['=S|"x"', "S", 1],
  ])("returns the prefix before a non-name character in %s", (marked, prefix, start) => {
    const { offset, tokens } = lexAtCaret(marked);

    expect(currentFunctionPrefix(tokens, offset)).toEqual({ prefix, start });
  });

  it.each([
    "=S|$A$1",
    "=S|SUM(A1)",
    "=S|UM",
    "=SU|M(A1)",
    "=S|1",
    "=S|A1",
    "=S|Sheet1!A1",
    "=S|A:A",
  ])("returns null when the letters join the next token in %s", (marked) => {
    const { offset, tokens } = lexAtCaret(marked);

    expect(currentFunctionPrefix(tokens, offset)).toBeNull();
  });
});
