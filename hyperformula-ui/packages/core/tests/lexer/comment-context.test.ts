import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";
import type { CommentMeta } from "../../src/lexer/types";

const lex = new Lexer();
function firstComment(source: string) {
  const token = lex.tokenize(source).find((found) => found.type === TokenType.COMMENT);
  if (!token) {
    throw new Error(`no COMMENT token in ${JSON.stringify(source)}`);
  }

  return token;
}

describe("Lexer — comment additive-context validation", () => {
  it("contextOk true after operand and before '+'", () => {
    const comment = firstComment("=A1\n// note\n+ B1");

    expect((comment.meta as CommentMeta).contextOk).toBe(true);
  });

  it("contextOk false when no operand precedes", () => {
    const comment = firstComment("=// note\nA1");

    expect((comment.meta as CommentMeta).contextOk).toBe(false);
  });

  it("contextOk true between operand and comma inside function args", () => {
    const comment = firstComment("=SUM(A1 // note\n, B1)");

    expect((comment.meta as CommentMeta).contextOk).toBe(true);
  });

  it("contextOk false when follower is an operand (no operator/comma/rparen)", () => {
    const comment = firstComment("=SUM(A1, // note\nB1)");

    expect((comment.meta as CommentMeta).contextOk).toBe(false);
  });

  it("contextOk true at end of arg before ')'", () => {
    const comment = firstComment("=SUM(A1, B1 // note\n)");

    expect((comment.meta as CommentMeta).contextOk).toBe(true);
  });

  it("contextOk true at end of formula (EOF as closer)", () => {
    const comment = firstComment("=A1 // note");

    expect((comment.meta as CommentMeta).contextOk).toBe(true);
  });
});
