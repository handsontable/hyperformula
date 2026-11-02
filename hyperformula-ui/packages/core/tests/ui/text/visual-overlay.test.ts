import { describe, expect, it } from "vitest";
import { Lexer } from "../../../src/lexer/lexer";
import { TokenType } from "../../../src/lexer/tokens";
import type { Token } from "../../../src/lexer/types";
import { CN, TOKEN_CN } from "../../../src/theme/classNames";
import { computeDecorations } from "../../../src/ui/text/decorations";
import { DATA_TOKEN_IDX, VisualOverlay } from "../../../src/ui/text/visualOverlay";

const lex = new Lexer();
const ZERO_WIDTH_SPACE = "​";

function makeToken(type: TokenType, value: string, start: number, meta?: Token["meta"]): Token {
  const token: Token = { type, value, start, end: start + value.length };

  if (meta !== undefined) {
    token.meta = meta;
  }

  return token;
}

function spanAt(overlay: VisualOverlay, tokenIndex: number): HTMLElement | null {
  return overlay.root.querySelector(`[${DATA_TOKEN_IDX}="${tokenIndex}"]`);
}

describe("VisualOverlay root element", () => {
  it("creates a div carrying the overlay class", () => {
    const overlay = new VisualOverlay();

    expect(overlay.root.tagName).toBe("DIV");
    expect(overlay.root.classList.contains(CN.overlay)).toBe(true);
  });

  it("hides the mirror from assistive technology", () => {
    const overlay = new VisualOverlay();

    expect(overlay.root.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes the mirror to assistive technology when opted in", () => {
    const overlay = new VisualOverlay({ exposedToAccessibility: true });

    expect(overlay.root.getAttribute("aria-hidden")).toBeNull();
  });
});

describe("VisualOverlay text fidelity", () => {
  it("mirrors the source text exactly, ending with a zero-width space sentinel", () => {
    const text = "=SUM( A1 , 2 )";
    const overlay = new VisualOverlay();

    overlay.render(lex.tokenize(text), text);

    expect(overlay.root.textContent).toBe(`${text}${ZERO_WIDTH_SPACE}`);
  });

  it("renders whitespace tokens as bare text nodes rather than spans", () => {
    const text = "= 1";
    const overlay = new VisualOverlay();

    overlay.render(lex.tokenize(text), text);

    const whitespaceNode = overlay.root.childNodes[1];

    if (!whitespaceNode) {
      throw new Error("expected a node between the two token spans");
    }

    expect(whitespaceNode.nodeType).toBe(Node.TEXT_NODE);
    expect(whitespaceNode.textContent).toBe(" ");
    expect(overlay.root.querySelector(`.${TOKEN_CN[TokenType.WHITESPACE]}`)).toBeNull();
  });

  it("preserves a trailing newline before the sentinel", () => {
    const text = "=1\n";
    const overlay = new VisualOverlay();

    overlay.render(lex.tokenize(text), text);

    expect(overlay.root.textContent).toBe(`=1\n${ZERO_WIDTH_SPACE}`);
  });

  it("fills gaps the tokens do not cover from the raw text", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      makeToken(TokenType.OPERATOR, "=", 0),
      makeToken(TokenType.NUMBER, "1", 3),
    ];

    overlay.render(tokens, "=  1");

    const gapNode = overlay.root.childNodes[1];

    if (!gapNode) {
      throw new Error("expected a gap node between the token spans");
    }

    expect(gapNode.nodeType).toBe(Node.TEXT_NODE);
    expect(gapNode.textContent).toBe("  ");
    expect(overlay.root.textContent).toBe(`=  1${ZERO_WIDTH_SPACE}`);
  });

  it("appends raw text remaining after the last token", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [makeToken(TokenType.OPERATOR, "=", 0)];

    overlay.render(tokens, "=abc");

    expect(overlay.root.textContent).toBe(`=abc${ZERO_WIDTH_SPACE}`);
    expect(overlay.root.children).toHaveLength(1);
  });

  it("renders token-free text as a single text node", () => {
    const overlay = new VisualOverlay();

    overlay.render([], "plain");

    expect(overlay.root.textContent).toBe(`plain${ZERO_WIDTH_SPACE}`);
    expect(overlay.root.children).toHaveLength(0);
  });

  it("skips holes in a sparse token array without losing text", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [];

    tokens[0] = makeToken(TokenType.OPERATOR, "=", 0);
    tokens[2] = makeToken(TokenType.NUMBER, "1", 1);

    overlay.render(tokens, "=1");

    expect(overlay.root.textContent).toBe(`=1${ZERO_WIDTH_SPACE}`);
    expect(spanAt(overlay, 2)?.textContent).toBe("1");
  });
});

describe("VisualOverlay render", () => {
  it("tags each token span with its token index", () => {
    const text = "=SUM(1)";
    const overlay = new VisualOverlay();

    overlay.render(lex.tokenize(text), text);

    expect(spanAt(overlay, 1)?.textContent).toBe("SUM");
    expect(spanAt(overlay, 3)?.textContent).toBe("1");
  });

  it("replaces the previous content on each render", () => {
    const overlay = new VisualOverlay();
    const firstText = "=SUM(1)";
    const secondText = "=1";

    overlay.render(lex.tokenize(firstText), firstText);
    overlay.render(lex.tokenize(secondText), secondText);

    expect(overlay.root.textContent).toBe(`${secondText}${ZERO_WIDTH_SPACE}`);
    expect(overlay.root.querySelector(`.${TOKEN_CN[TokenType.FUNCTION]}`)).toBeNull();
  });

  it("restarts ref palette indices on each render", () => {
    const overlay = new VisualOverlay();
    const firstText = "=A1+B2";
    const secondText = "=B2";

    overlay.render(lex.tokenize(firstText), firstText);

    const refMarksBefore = overlay.root.querySelectorAll<HTMLElement>(`.${CN.refMark}`);

    expect(refMarksBefore[1]?.dataset.refIndex).toBe("1");

    overlay.render(lex.tokenize(secondText), secondText);

    const refMarksAfter = overlay.root.querySelectorAll<HTMLElement>(`.${CN.refMark}`);

    expect(refMarksAfter[0]?.dataset.refIndex).toBe("0");
  });

  it("gives refs that differ only by case the same palette index", () => {
    const overlay = new VisualOverlay();
    const text = "=A1+a1";

    overlay.render(lex.tokenize(text), text);

    const refMarks = overlay.root.querySelectorAll<HTMLElement>(`.${CN.refMark}`);

    expect(refMarks[0]?.dataset.refIndex).toBe("0");
    expect(refMarks[1]?.dataset.refIndex).toBe("0");
  });

  it("defaults to empty decorations when none are given", () => {
    const text = "=SUM(1)";
    const overlay = new VisualOverlay();

    overlay.render(lex.tokenize(text), text);

    const openParen = spanAt(overlay, 2);

    expect(openParen?.dataset.parenDepth).toBeUndefined();
    expect(openParen?.classList.contains(CN.parenMatch)).toBe(false);
    expect(openParen?.classList.contains(CN.tokenParenErr)).toBe(false);
  });

  it("wraps data-paren-depth beyond the six-step depth palette", () => {
    const text = "=(((((((1)))))))";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 0));

    expect(spanAt(overlay, 6)?.dataset.parenDepth).toBe("5");
    expect(spanAt(overlay, 7)?.dataset.parenDepth).toBe("0");
  });

  it("matches known functions case-insensitively", () => {
    const overlay = new VisualOverlay({ knownFunctions: new Set(["SUM"]) });
    const tokens: Token[] = [
      makeToken(TokenType.OPERATOR, "=", 0),
      makeToken(TokenType.FUNCTION, "sum", 1),
      makeToken(TokenType.LPAREN, "(", 4),
      makeToken(TokenType.NUMBER, "1", 5),
      makeToken(TokenType.RPAREN, ")", 6),
    ];

    overlay.render(tokens, "=sum(1)");

    expect(spanAt(overlay, 1)?.classList.contains(CN.tokenFnUnknown)).toBe(false);
  });
});

describe("VisualOverlay in-place decoration diffing", () => {
  it("preserves element identity and updates classes when tokens/text are unchanged", () => {
    const text = "=SUM(1,2)";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 5));

    const openParenBefore = spanAt(overlay, 2);
    const closeParenBefore = spanAt(overlay, 6);

    expect(openParenBefore?.classList.contains(CN.parenMatch)).toBe(true);

    overlay.render(tokens, text, computeDecorations(tokens, 0));

    const openParenAfter = spanAt(overlay, 2);
    const closeParenAfter = spanAt(overlay, 6);

    expect(openParenAfter).toBe(openParenBefore);
    expect(closeParenAfter).toBe(closeParenBefore);
    expect(openParenAfter?.classList.contains(CN.parenMatch)).toBe(false);
  });

  it("rebuilds fresh elements when text changes even if the caller reuses a decorations object", () => {
    const firstText = "=SUM(1,2)";
    const secondText = "=SUM(1,3)";
    const firstTokens = lex.tokenize(firstText);
    const secondTokens = lex.tokenize(secondText);
    const overlay = new VisualOverlay();

    overlay.render(firstTokens, firstText, computeDecorations(firstTokens, 5));

    const openParenBefore = spanAt(overlay, 2);

    overlay.render(secondTokens, secondText, computeDecorations(secondTokens, 5));

    const openParenAfter = spanAt(overlay, 2);

    expect(openParenAfter).not.toBe(openParenBefore);
    expect(openParenAfter?.textContent).toBe("(");
  });

  it("rebuilds when a deep-equal but distinct token array is passed (deep compare, not identity)", () => {
    const text = "=SUM(1,2)";
    const overlay = new VisualOverlay();
    const firstTokens = lex.tokenize(text);
    const secondTokens = lex.tokenize(text);

    overlay.render(firstTokens, text, computeDecorations(firstTokens, 5));

    const openParenBefore = spanAt(overlay, 2);

    overlay.render(secondTokens, text, computeDecorations(secondTokens, 0));

    const openParenAfter = spanAt(overlay, 2);

    expect(openParenAfter).toBe(openParenBefore);
    expect(openParenAfter?.classList.contains(CN.parenMatch)).toBe(false);
  });
});

describe("VisualOverlay comment tokens", () => {
  it("renders a context-valid comment with the comment class only", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      makeToken(TokenType.OPERATOR, "=", 0),
      makeToken(TokenType.NUMBER, "1", 1),
      makeToken(TokenType.WHITESPACE, " ", 2),
      makeToken(TokenType.COMMENT, "// note", 3, { text: "note", contextOk: true }),
    ];

    overlay.render(tokens, "=1 // note");

    const commentSpan = spanAt(overlay, 3);

    expect(commentSpan?.classList.contains(TOKEN_CN[TokenType.COMMENT])).toBe(true);
    expect(commentSpan?.classList.contains(CN.tokenCommentErr)).toBe(false);
    expect(commentSpan?.textContent).toBe("// note");
  });

  it("marks a context-invalid comment with the comment error class", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      makeToken(TokenType.OPERATOR, "=", 0),
      makeToken(TokenType.COMMENT, "// stray", 1, { text: "stray", contextOk: false }),
      makeToken(TokenType.OPERATOR, "+", 9),
      makeToken(TokenType.NUMBER, "1", 10),
    ];

    overlay.render(tokens, "=// stray+1");

    const commentSpan = spanAt(overlay, 1);

    expect(commentSpan?.classList.contains(TOKEN_CN[TokenType.COMMENT])).toBe(true);
    expect(commentSpan?.classList.contains(CN.tokenCommentErr)).toBe(true);
  });
});
