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
    const font = "var(--hfe-error-font-family, var(--hfe-font-family))";

    expect(declarations(".hfe-cell--error")["font-family"]).toBe(font);
    expect(declarations(".hfe-error__title")["font-family"]).toBe(font);
  });

  it("leaves --hfe-error-font-family unset, so --hfe-font-family resolves where the error renders", () => {
    expect(declarations(":root")["--hfe-error-font-family"]).toBeUndefined();
  });
});

describe("package color scheme", () => {
  it("never selects package elements by a class-attribute substring", () => {
    expect(CSS_TEXT).not.toContain("[class*=");
  });

  it("sets no color scheme, so every package element inherits the host's", () => {
    expect(CSS_TEXT).not.toContain("color-scheme");
  });
});

const MIN_TEXT_CONTRAST = 4.5;
const MIN_REF_DISTANCE = 10;
const REF_COLOR_COUNT = 8;

function lightDarkPair(property: string): [string, string] {
  const value = declarations(":root")[property] ?? "";
  const pair = /^light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)$/i.exec(value);

  if (!pair?.[1] || !pair[2]) {
    throw new Error(`expected ${property} to be light-dark(#rrggbb, #rrggbb), got ${value}`);
  }

  return [pair[1], pair[2]];
}

function linearChannels(hex: string): [number, number, number] {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return [red, green, blue];
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = linearChannels(hex);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function oklab(hex: string): [number, number, number] {
  const [red, green, blue] = linearChannels(hex);
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);

  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ];
}

function perceptualDistance(first: string, second: string): number {
  const [firstL, firstA, firstB] = oklab(first);
  const [secondL, secondA, secondB] = oklab(second);

  return 100 * Math.hypot(firstL - secondL, firstA - secondA, firstB - secondB);
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  );

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe("reference palette", () => {
  const [lightBackground, darkBackground] = lightDarkPair("--hfe-color-background");

  it.each(
    Array.from({ length: REF_COLOR_COUNT }, (_, i) => `--hfe-ref-${i + 1}`),
  )("%s clears 4.5:1 on the light and dark editor backgrounds", (property) => {
    const [light, dark] = lightDarkPair(property);

    expect(contrastRatio(light, lightBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrastRatio(dark, darkBackground)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it.each([
    ["light", 0],
    ["dark", 1],
  ] as const)("keeps every pair of %s reference colors visibly apart", (_scheme, side) => {
    const colors = Array.from(
      { length: REF_COLOR_COUNT },
      (_, i) => lightDarkPair(`--hfe-ref-${i + 1}`)[side],
    );

    for (const [i, first] of colors.entries()) {
      for (const second of colors.slice(i + 1)) {
        expect(perceptualDistance(first, second)).toBeGreaterThanOrEqual(MIN_REF_DISTANCE);
      }
    }
  });
});
