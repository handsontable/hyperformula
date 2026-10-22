import { describe, expect, it } from "vitest";
import { Lexer } from "../../../src/lexer/lexer";
import { currentFunctionPrefix } from "../../../src/ui/caret/tokenContext";

const lex = new Lexer();

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
});
