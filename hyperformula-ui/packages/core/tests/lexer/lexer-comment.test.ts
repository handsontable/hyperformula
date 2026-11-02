import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/lexer/lexer";
import { TokenType } from "../../src/lexer/tokens";
import type { CommentMeta } from "../../src/lexer/types";

const lex = new Lexer();
const types = (source: string) => lex.tokenize(source).map((token) => token.type);
const find = (source: string, type: TokenType) =>
  lex.tokenize(source).filter((token) => token.type === type);

describe("Lexer — comments", () => {
  it("emits COMMENT for '// foo' at start", () => {
    const tokens = lex.tokenize("// foo");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.COMMENT);
    expect(tokens[0]?.value).toBe("// foo");
    expect((tokens[0]?.meta as CommentMeta).text).toBe("foo");
  });

  it("emits COMMENT after operand on same line", () => {
    expect(types("=A1 // note")).toContain(TokenType.COMMENT);
    const commentToken = find("=A1 // note", TokenType.COMMENT)[0];

    if (!commentToken) {
      throw new Error("expected COMMENT token");
    }

    expect(commentToken.value).toBe("// note");
    expect((commentToken.meta as CommentMeta).text).toBe("note");
  });

  it("comment ends at newline, not through it", () => {
    const tokens = lex.tokenize("=A1 // note\n+ B1");
    const commentToken = tokens.find((token) => token.type === TokenType.COMMENT);

    if (!commentToken) {
      throw new Error("expected COMMENT token");
    }

    expect(commentToken.value).toBe("// note");
    expect(commentToken.end).toBe("=A1 ".length + "// note".length);
  });

  it("'//' inside string literal does not start a comment", () => {
    const tokens = lex.tokenize('"a//b"');

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.STRING);
  });

  it("empty comment '//' produces payload ''", () => {
    const tokens = lex.tokenize("//");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.type).toBe(TokenType.COMMENT);
    expect((tokens[0]?.meta as CommentMeta).text).toBe("");
  });

  it("single '/' stays as OPERATOR (division)", () => {
    const tokens = lex.tokenize("=A1/B1");

    expect(tokens.map((token) => token.type)).toEqual([
      TokenType.OPERATOR,
      TokenType.CELL_REF,
      TokenType.OPERATOR,
      TokenType.CELL_REF,
    ]);
  });

  it("'//' wins over single '/' (A1//B1 → CELL_REF + COMMENT)", () => {
    const tokens = lex.tokenize("A1//B1");

    expect(tokens.map((token) => token.type)).toEqual([TokenType.CELL_REF, TokenType.COMMENT]);
    expect((tokens[1]?.meta as CommentMeta).text).toBe("B1");
  });

  it("strips one leading space from payload but keeps further spaces", () => {
    const tokens = lex.tokenize("//   spaced");

    expect((tokens[0]?.meta as CommentMeta).text).toBe("  spaced");
  });
});
