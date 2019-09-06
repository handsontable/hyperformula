import {ColumnIndex} from "../src/ColumnIndex";
import {adr} from "./testUtils";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";

describe("Column index", () => {
  it('should add value to empty index', function () {
    const index = new ColumnIndex()
    index.add(1, adr("B5"))

    const columnMap = index.getColumnMap(0, 1)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)![0]).toBe(4)
  });
})
