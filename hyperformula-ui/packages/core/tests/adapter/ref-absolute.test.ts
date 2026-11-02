import { describe, expect, it } from "vitest";
import { cycleRefAbsolute } from "../../src/adapter/refAbsolute";

describe("cycleRefAbsolute", () => {
  it("cycles a relative cell through all four states and back", () => {
    expect(cycleRefAbsolute("A1")).toBe("$A$1");
    expect(cycleRefAbsolute("$A$1")).toBe("A$1");
    expect(cycleRefAbsolute("A$1")).toBe("$A1");
    expect(cycleRefAbsolute("$A1")).toBe("A1");
  });

  it("preserves a plain sheet prefix", () => {
    expect(cycleRefAbsolute("Sheet1!A1")).toBe("Sheet1!$A$1");
  });

  it("preserves a quoted sheet prefix", () => {
    expect(cycleRefAbsolute("'My Sheet'!A1")).toBe("'My Sheet'!$A$1");
  });

  it("advances both range endpoints in lockstep", () => {
    expect(cycleRefAbsolute("A1:B2")).toBe("$A$1:$B$2");
    expect(cycleRefAbsolute("$A$1:$B$2")).toBe("A$1:B$2");
  });

  it("returns the input unchanged when it is not a ref", () => {
    expect(cycleRefAbsolute("SUM")).toBe("SUM");
  });
});
