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

describe("package color scheme", () => {
  it("never selects package elements by a class-attribute substring", () => {
    expect(CSS_TEXT).not.toContain("[class*=");
  });

  it("sets the color scheme only on the package roots, where a host theme class overrides it", () => {
    const roots = ":where(.hfe-editor,.hfe-formula-bar,.hfe-popup-portal,.hfe-popup--hosted)";

    expect(declarations(roots)["color-scheme"]).toBe("light dark");
    expect(CSS_TEXT.match(/color-scheme:/g)).toHaveLength(1);
  });
});

const MIN_TEXT_CONTRAST = 4.5;
const REF_COLOR_COUNT = 8;

function lightDarkPair(property: string): [string, string] {
  const value = declarations(":root")[property] ?? "";
  const pair = /^light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)$/i.exec(value);

  if (!pair?.[1] || !pair[2]) {
    throw new Error(`expected ${property} to be light-dark(#rrggbb, #rrggbb), got ${value}`);
  }

  return [pair[1], pair[2]];
}

function relativeLuminance(hex: string): number {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  );

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe("reference palette", () => {
  const [lightBackground, darkBackground] = lightDarkPair("--hfe-color-background");

  it.each(Array.from({ length: REF_COLOR_COUNT }, (_, i) => `--hfe-ref-${i + 1}`))(
    "%s clears 4.5:1 on the light and dark editor backgrounds",
    (property) => {
      const [light, dark] = lightDarkPair(property);

      expect(contrastRatio(light, lightBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      expect(contrastRatio(dark, darkBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    },
  );
});
