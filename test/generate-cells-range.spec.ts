import {generateCellsFromRange} from '../src/GraphBuilder'

describe("generateCellsFromRange", () => {
  it("one element", () => {
    expect(generateCellsFromRange("A1", "A1")).toEqual([["A1"]])
  });

  it("simple row", () => {
    expect(generateCellsFromRange("A1", "B1")).toEqual([["A1", "B1"]])
  });

  it("simple column", () => {
    expect(generateCellsFromRange("A1", "A2")).toEqual([["A1"], ["A2"]])
  });

  it("simple square", () => {
    expect(generateCellsFromRange("A1", "B2")).toEqual([["A1", "B1"], ["A2", "B2"]])
  });
})
