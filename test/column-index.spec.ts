import {ColumnIndex} from "../src/ColumnIndex";
import {adr} from "./testUtils";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";
import {Statistics} from "../src/statistics/Statistics";

describe("Column index", () => {
  it('should add value to empty index', function () {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("B5"))

    const columnMap = index.getColumnMap(0, 1)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)![0]).toBe(4)
  });

  it('should keep values in sorted order', function () {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A3"))
    index.add(1, adr("A5"))
    index.add(1, adr("A1"))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)![0]).toBe(0)
  });

  it('should not store duplicates', function () {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("A5"))
    index.add(1, adr("A5"))
    index.add(1, adr("A1"))
    index.add(1, adr("A1"))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)!.length).toBe(2)
  });
})
