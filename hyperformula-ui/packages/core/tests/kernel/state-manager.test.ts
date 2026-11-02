import { describe, expect, it } from "vitest";
import { Kernel } from "../../src/kernel/kernel";
import { TokenType } from "../../src/lexer/tokens";

describe("Kernel/StateManager", () => {
  it("applyEdit updates text + cursor + tokens", () => {
    const kernel = new Kernel();

    kernel.applyEdit("=A1", { offset: 3 });
    const state = kernel.getState();

    expect(state.text).toBe("=A1");
    expect(state.cursor.offset).toBe(3);
    expect(state.tokens.length).toBeGreaterThan(0);
  });

  it("emits events in order", () => {
    const kernel = new Kernel();
    const calls: string[] = [];

    kernel.bus.on("tokenize", () => calls.push("tokenize"));
    kernel.bus.on("change", () => calls.push("change"));
    kernel.applyEdit("=1+1", { offset: 4 });
    expect(calls).toEqual(["tokenize", "change"]);
  });

  it("replaceRange edits subrange", () => {
    const kernel = new Kernel();

    kernel.applyEdit("=A1+B2", { offset: 6 });
    kernel.replaceRange(3, 5, "*");
    expect(kernel.getState().text).toBe("=A1*2");
  });
});

describe("Kernel.tokenPostProcess", () => {
  it("runs the post-processor over freshly lexed tokens", () => {
    const kernel = new Kernel();

    kernel.tokenPostProcess = (tokens) =>
      tokens.map((token) =>
        token.type === TokenType.IDENT ? { ...token, type: TokenType.NAMED_EXPR } : token,
      );
    kernel.applyEdit("=Foo", { offset: 4 });

    const namedExpr = kernel.getTokens().find((token) => token.value === "Foo");

    expect(namedExpr?.type).toBe(TokenType.NAMED_EXPR);
  });

  it("leaves tokens untouched when no post-processor is set", () => {
    const kernel = new Kernel();

    kernel.applyEdit("=Foo", { offset: 4 });

    const ident = kernel.getTokens().find((token) => token.value === "Foo");

    expect(ident?.type).toBe(TokenType.IDENT);
  });
});
