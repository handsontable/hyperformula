import { describe, expect, it, vi } from "vitest";
import { Kernel } from "../../src/kernel/kernel";
import { TokenType } from "../../src/lexer/tokens";

describe("Kernel", () => {
  it("passes lexer separator options through to the lexer", () => {
    const kernel = new Kernel({ decimalSeparator: ",", argSeparator: ";", arrayRowSeparator: "|" });

    kernel.applyEdit("=SUM(1,5;2)", { offset: 11 });
    const numbers = kernel.getTokens().filter((token) => token.type === TokenType.NUMBER);

    expect(numbers.map((token) => token.value)).toEqual(["1,5", "2"]);
  });

  it("setCaret is a no-op and returns false when the offset is unchanged", () => {
    const kernel = new Kernel();

    kernel.applyEdit("=A1", { offset: 3 });
    const onCaretMove = vi.fn();

    kernel.bus.on("caretmove", onCaretMove);

    expect(kernel.setCaret({ offset: 3 })).toBe(false);
    expect(onCaretMove).not.toHaveBeenCalled();

    expect(kernel.setCaret({ offset: 1 })).toBe(true);
    expect(onCaretMove).toHaveBeenCalledTimes(1);
    expect(kernel.getState().cursor.offset).toBe(1);
  });
});
