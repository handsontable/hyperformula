import { describe, expect, it } from "vitest";
import { validateNamedExprName } from "../../src/engine/namedExprName";

describe("validateNamedExprName", () => {
  it("accepts names following HyperFormula rules", () => {
    expect(validateNamedExprName("myRevenue")).toBe(true);
    expect(validateNamedExprName("quarter_1")).toBe(true);
    expect(validateNamedExprName("_1stQuarter")).toBe(true);
    expect(validateNamedExprName("ASP.NET")).toBe(true);
    expect(validateNamedExprName("Råte")).toBe(true);
  });

  it("rejects spaces, leading digits and leading dot", () => {
    expect(validateNamedExprName("my Revenue")).toBe(false);
    expect(validateNamedExprName("1stQuarter")).toBe(false);
    expect(validateNamedExprName(".NET")).toBe(false);
    expect(validateNamedExprName("")).toBe(false);
  });

  it("rejects A1 and R1C1 reference shapes", () => {
    expect(validateNamedExprName("A1")).toBe(false);
    expect(validateNamedExprName("Q4")).toBe(false);
    expect(validateNamedExprName("quarter1")).toBe(false);
    expect(validateNamedExprName("RC")).toBe(false);
    expect(validateNamedExprName("R4C5")).toBe(false);
  });
});
