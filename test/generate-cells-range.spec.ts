import {generateCellsFromRange} from '../src/GraphBuilder'
import {CellAddress, relativeCellAddress} from "../src/Cell"

describe("generateCellsFromRange", () => {
  it("one element", () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(0, 0))).toEqual([
      [relativeCellAddress(0, 0)]
    ])
  });

  it("simple row", () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(1, 0))).toEqual([
      [relativeCellAddress(0, 0), relativeCellAddress(1, 0)]
    ])
  });

  it("simple column", () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(0, 1))).toEqual([
      [relativeCellAddress(0, 0)], [relativeCellAddress(0, 1)]
    ])
  });

  it("simple square", () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(1, 1))).toEqual([
      [relativeCellAddress(0, 0), relativeCellAddress(1, 0)],
      [relativeCellAddress(0, 1), relativeCellAddress(1, 1)]
    ])
  });
})
