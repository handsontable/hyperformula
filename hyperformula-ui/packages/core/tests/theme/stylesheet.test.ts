import { describe, expect, it } from "vitest";
import { CSS_TEXT } from "../../src/theme/cssText";

function declarations(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = new RegExp(`(?:^|})${escaped}\\{([^}]*)\\}`).exec(CSS_TEXT);

  if (!rule) {
    throw new Error(`expected a rule for ${selector}`);
  }

  return Object.fromEntries(
    (rule[1] ?? "")
      .split(";")
      .filter((declaration) => declaration.includes(":"))
      .map((declaration) => {
        const separator = declaration.indexOf(":");

        return [declaration.slice(0, separator).trim(), declaration.slice(separator + 1).trim()];
      }),
  );
}

describe("package stylesheet", () => {
  it("renders the error value in a cell and the error popup title in the same font", () => {
    const cellFont = declarations(".hfe-cell--error")["font-family"];

    expect(cellFont).toBe("var(--hfe-error-font-family)");
    expect(declarations(".hfe-error__title")["font-family"]).toBe(cellFont);
    expect(declarations(":root")["--hfe-error-font-family"]).toBe("var(--hfe-font-family)");
  });
});
