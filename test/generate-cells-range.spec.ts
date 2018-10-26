import {generateCellsFromRange} from '../src/GraphBuilder'
import {CellAddress} from "../src/Vertex"

const cellAddress = (col: number, row: number): CellAddress => ({ col, row })

describe("generateCellsFromRange", () => {
  it("one element", () => {
    expect(generateCellsFromRange(cellAddress(0, 0), cellAddress(0, 0))).toEqual([
      [cellAddress(0, 0)]
    ])
  });

  it("simple row", () => {
    expect(generateCellsFromRange(cellAddress(0, 0), cellAddress(1, 0))).toEqual([
      [cellAddress(0, 0), cellAddress(1, 0)]
    ])
  });

  it("simple column", () => {
    expect(generateCellsFromRange(cellAddress(0, 0), cellAddress(0, 1))).toEqual([
      [cellAddress(0, 0)], [cellAddress(0, 1)]
    ])
  });

  it("simple square", () => {
    expect(generateCellsFromRange(cellAddress(0, 0), cellAddress(1, 1))).toEqual([
      [cellAddress(0, 0), cellAddress(1, 0)],
      [cellAddress(0, 1), cellAddress(1, 1)]
    ])
  });
})
