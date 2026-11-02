import { describe, expect, it } from "vitest";
import { Lexer } from "../../../src/lexer/lexer";
import { TokenType } from "../../../src/lexer/tokens";
import type { Token } from "../../../src/lexer/types";
import { CN } from "../../../src/theme/classNames";
import { computeDecorations } from "../../../src/ui/text/decorations";
import { DATA_TOKEN_IDX, VisualOverlay } from "../../../src/ui/text/visualOverlay";

const lex = new Lexer();

function spanAt(overlay: VisualOverlay, tokenIndex: number): HTMLElement | null {
  return overlay.root.querySelector(`[${DATA_TOKEN_IDX}="${tokenIndex}"]`);
}

describe("VisualOverlay decorations", () => {
  it("tags paren spans with their nesting depth", () => {
    const text = "=SUM(IF(A1,1),2)";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 0));

    expect(spanAt(overlay, 2)?.dataset.parenDepth).toBe("0");
    expect(spanAt(overlay, 4)?.dataset.parenDepth).toBe("1");
    expect(spanAt(overlay, 11)?.dataset.parenDepth).toBe("0");
  });

  it("marks the matching paren pair", () => {
    const text = "=SUM(1,2)";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 5));

    expect(spanAt(overlay, 2)?.classList.contains("hfe-token--paren-match")).toBe(true);
    expect(spanAt(overlay, 6)?.classList.contains("hfe-token--paren-match")).toBe(true);
    expect(spanAt(overlay, 3)?.classList.contains("hfe-token--paren-match")).toBe(false);
  });

  it("dims tokens outside the active function range", () => {
    const text = "=SUM(IF(A1,1),2)";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 9));

    expect(spanAt(overlay, 1)?.classList.contains("hfe-token--dim")).toBe(true);
    expect(spanAt(overlay, 11)?.classList.contains("hfe-token--dim")).toBe(true);
    expect(spanAt(overlay, 3)?.classList.contains("hfe-token--dim")).toBe(false);
    expect(spanAt(overlay, 5)?.classList.contains("hfe-token--dim")).toBe(false);
  });

  it("emphasizes the current argument span", () => {
    const text = "=SUM(1,2)";
    const tokens = lex.tokenize(text);
    const overlay = new VisualOverlay();

    overlay.render(tokens, text, computeDecorations(tokens, 8));

    expect(spanAt(overlay, 5)?.classList.contains("hfe-token--arg-active")).toBe(true);
    expect(spanAt(overlay, 3)?.classList.contains("hfe-token--arg-active")).toBe(false);
  });
});

describe("VisualOverlay named expressions", () => {
  it("renders a NAMED_EXPR token as a ref-mark with data-ref-index", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.NAMED_EXPR,
        value: "SalesRange",
        start: 1,
        end: 11,
        meta: {
          named: true,
          kind: "range",
          sheet: "Sheet1",
          range: { start: { col: 0, row: 0 }, end: { col: 0, row: 9 } },
        },
      },
    ];

    overlay.render(tokens, "=SalesRange");

    const node = overlay.root.querySelector(`.${CN.refMarkNamed}`) as HTMLElement;

    expect(node).not.toBeNull();
    expect(node.textContent).toBe("SalesRange");
    expect(node.dataset.refIndex).toBe("0");
  });

  it("assigns sequential indices to multiple refs in first-appearance order", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.CELL_REF,
        value: "A1",
        start: 1,
        end: 3,
        meta: { col: 0, row: 0, abs: { col: false, row: false } },
      },
      { type: TokenType.OPERATOR, value: "+", start: 3, end: 4 },
      {
        type: TokenType.CELL_REF,
        value: "B2",
        start: 4,
        end: 6,
        meta: { col: 1, row: 1, abs: { col: false, row: false } },
      },
      { type: TokenType.OPERATOR, value: "+", start: 6, end: 7 },
      {
        type: TokenType.CELL_REF,
        value: "A1",
        start: 7,
        end: 9,
        meta: { col: 0, row: 0, abs: { col: false, row: false } },
      },
    ];

    overlay.render(tokens, "=A1+B2+A1");

    const spans = overlay.root.querySelectorAll<HTMLElement>(".hfe-ref-mark");

    expect(spans[0]?.dataset.refIndex).toBe("0");
    expect(spans[1]?.dataset.refIndex).toBe("1");
    expect(spans[2]?.dataset.refIndex).toBe("0");
  });

  it("renders LBRACE/RBRACE as hfe-token--bracket", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      { type: TokenType.LBRACE, value: "{", start: 1, end: 2 },
      { type: TokenType.RBRACE, value: "}", start: 2, end: 3 },
    ];
    overlay.render(tokens, "={}", computeDecorations(tokens, 0));
    expect(spanAt(overlay, 1)?.classList.contains("hfe-token--bracket")).toBe(true);
    expect(spanAt(overlay, 2)?.classList.contains("hfe-token--bracket")).toBe(true);
  });

  it("marks unmatched LPAREN with hfe-token--paren-err", () => {
    const overlay = new VisualOverlay();
    const tokens = lex.tokenize("=SUM(A1");
    overlay.render(tokens, "=SUM(A1", computeDecorations(tokens, 0));

    const parenSpan = overlay.root.querySelector<HTMLElement>(".hfe-token--paren");

    expect(parenSpan?.classList.contains("hfe-token--paren-err")).toBe(true);
  });

  it("does not mark a balanced LPAREN with hfe-token--paren-err", () => {
    const overlay = new VisualOverlay();
    const tokens = lex.tokenize("=SUM(1)");
    overlay.render(tokens, "=SUM(1)", computeDecorations(tokens, 0));

    const parenSpans = overlay.root.querySelectorAll<HTMLElement>(".hfe-token--paren");

    for (const span of parenSpans) {
      expect(span.classList.contains("hfe-token--paren-err")).toBe(false);
    }
  });

  it("marks unmatched RPAREN with hfe-token--paren-err", () => {
    const overlay = new VisualOverlay();
    const tokens = lex.tokenize("=SUM(1))");
    overlay.render(tokens, "=SUM(1))", computeDecorations(tokens, 0));

    const parenSpans = overlay.root.querySelectorAll<HTMLElement>(".hfe-token--paren");
    const errSpans = [...parenSpans].filter((s) => s.classList.contains("hfe-token--paren-err"));

    expect(errSpans).toHaveLength(1);
  });

  it("renders COMMA as hfe-token--sep", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      { type: TokenType.COMMA, value: ",", start: 1, end: 2 },
    ];
    overlay.render(tokens, "=,", computeDecorations(tokens, 0));
    expect(spanAt(overlay, 1)?.classList.contains("hfe-token--sep")).toBe(true);
  });

  it("splits cross-sheet ref into sheet qualifier and cell address spans", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.CELL_REF,
        value: "Sheet1!A1",
        start: 1,
        end: 10,
        meta: { sheet: "Sheet1", col: 0, row: 0, abs: { col: false, row: false } },
      },
    ];
    overlay.render(tokens, "=Sheet1!A1", computeDecorations(tokens, 0));

    const refMark = overlay.root.querySelector<HTMLElement>(".hfe-ref-mark");

    expect(refMark).not.toBeNull();

    const sheetSpan = refMark?.querySelector<HTMLElement>(".hfe-token--sheet");

    expect(sheetSpan?.textContent).toBe("Sheet1!");
    expect(refMark?.textContent).toBe("Sheet1!A1");
  });

  it("does not add sheet qualifier span for same-sheet refs", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.CELL_REF,
        value: "A1",
        start: 1,
        end: 3,
        meta: { col: 0, row: 0, abs: { col: false, row: false } },
      },
    ];
    overlay.render(tokens, "=A1", computeDecorations(tokens, 0));

    const refMark = overlay.root.querySelector<HTMLElement>(".hfe-ref-mark");

    expect(refMark?.querySelector(".hfe-token--sheet")).toBeNull();
  });

  it("renders unknown function with hfe-token--fn-unknown", () => {
    const overlay = new VisualOverlay({ knownFunctions: new Set(["SUM", "IF"]) });
    const tokens = lex.tokenize("=NOTAFUNC(1)");

    overlay.render(tokens, "=NOTAFUNC(1)", computeDecorations(tokens, 0));

    const fnSpan = overlay.root.querySelector<HTMLElement>(".hfe-token--fn");

    expect(fnSpan?.classList.contains("hfe-token--fn-unknown")).toBe(true);
  });

  it("does not mark a known function as unknown", () => {
    const overlay = new VisualOverlay({ knownFunctions: new Set(["SUM", "IF"]) });
    const tokens = lex.tokenize("=SUM(1)");

    overlay.render(tokens, "=SUM(1)", computeDecorations(tokens, 0));

    const fnSpan = overlay.root.querySelector<HTMLElement>(".hfe-token--fn");

    expect(fnSpan?.classList.contains("hfe-token--fn-unknown")).toBe(false);
  });

  it("does not mark function as unknown when no knownFunctions set provided", () => {
    const overlay = new VisualOverlay();
    const tokens = lex.tokenize("=NOTAFUNC(1)");

    overlay.render(tokens, "=NOTAFUNC(1)", computeDecorations(tokens, 0));

    const fnSpan = overlay.root.querySelector<HTMLElement>(".hfe-token--fn");

    expect(fnSpan?.classList.contains("hfe-token--fn-unknown")).toBe(false);
  });

  it("renders invalid reference with hfe-token--ref-invalid", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.CELL_REF,
        value: "A1",
        start: 1,
        end: 3,
        meta: { col: 0, row: 0, abs: { col: false, row: false }, invalid: true },
      },
    ];

    overlay.render(tokens, "=A1", computeDecorations(tokens, 0));

    const span = overlay.root.querySelector<HTMLElement>(`[${DATA_TOKEN_IDX}='1']`);

    expect(span?.classList.contains("hfe-token--ref-invalid")).toBe(true);
  });

  it("does not mark a valid reference as ref-invalid", () => {
    const overlay = new VisualOverlay();
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      {
        type: TokenType.CELL_REF,
        value: "A1",
        start: 1,
        end: 3,
        meta: { col: 0, row: 0, abs: { col: false, row: false } },
      },
    ];

    overlay.render(tokens, "=A1", computeDecorations(tokens, 0));

    const span = overlay.root.querySelector<HTMLElement>(`[${DATA_TOKEN_IDX}='1']`);

    expect(span?.classList.contains("hfe-token--ref-invalid")).toBe(false);
  });

  it("wraps data-ref-index at palette boundary so CSS rules always match", () => {
    const overlay = new VisualOverlay();
    const makeRef = (value: string, col: number): Token => ({
      type: TokenType.CELL_REF,
      value,
      start: 0,
      end: value.length,
      meta: { col, row: 0, abs: { col: false, row: false } },
    });
    const tokens: Token[] = [
      { type: TokenType.OPERATOR, value: "=", start: 0, end: 1 },
      makeRef("A1", 0),
      makeRef("B1", 1),
      makeRef("C1", 2),
      makeRef("D1", 3),
      makeRef("E1", 4),
      makeRef("F1", 5),
      makeRef("G1", 6),
      makeRef("H1", 7),
      makeRef("I1", 8),
    ];

    overlay.render(tokens, "=A1+B1+C1+D1+E1+F1+G1+H1+I1");

    const spans = overlay.root.querySelectorAll<HTMLElement>(".hfe-ref-mark");

    expect(spans[7]?.dataset.refIndex).toBe("7");
    expect(spans[8]?.dataset.refIndex).toBe("0");
  });
});
