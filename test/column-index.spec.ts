import {ColumnIndex} from "../src/ColumnIndex";
import {adr} from "./testUtils";
import {Statistics} from "../src/statistics/Statistics";
import {simpleCellAddress} from "../src/Cell";
import {RowsSpan} from "../src/RowsSpan";
import {ColumnsSpan} from "../src/ColumnsSpan";

describe("ColumnIndex#add", () => {
  it('should add value to empty index', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("B5"))

    const columnMap = index.getColumnMap(0, 1)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)![0]).toBe(4)
  });

  it('should keep values in sorted order', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A3"))
    index.add(1, adr("A5"))
    index.add(1, adr("A1"))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)![0]).toBe(0)
  });

  it('should not store duplicates', () => {
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

describe('ColumnIndex change/remove', () => {
  it('should remove value from index', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))

    index.remove(1, simpleCellAddress(0, 0, 1))

    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.length).toBe(2)
    expect(valueIndex).toContain(0)
    expect(valueIndex).toContain(2)
  })

  it('should do nothing if passed value is null', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))

    index.remove(null, simpleCellAddress(0, 0, 1))

    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.length).toBe(3)
    expect(valueIndex).toContain(0)
    expect(valueIndex).toContain(1)
    expect(valueIndex).toContain(2)
  })

  it('should change value in index', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))

    index.change(1, 2, simpleCellAddress(0, 0, 0))

    expect(index.getColumnMap(0, 0).keys()).not.toContain(1)
    const valueIndex = index.getColumnMap(0, 0).get(2)!
    expect(valueIndex).toContain(0)
  })

  it('should do nothing when changing to the same value', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))

    const spyRemove = spyOn(index, "remove")
    const spyAdd = spyOn(index, "add")

    index.change(1, 1, simpleCellAddress(0, 0, 0))

    expect(spyRemove).not.toHaveBeenCalled()
    expect(spyAdd).not.toHaveBeenCalled()
  })
})

describe('ColumnIndex#addRows', () => {
  it('should shift rows when adding rows', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))

    index.addRows(RowsSpan.fromNumberOfRows(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0, 3, 4, 5])
  })


})

describe('ColumnIndex#removeRows', () => {
  it('should shift rows when removing rows', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))
    index.add(1, adr("A5"))

    index.removeRows(RowsSpan.fromNumberOfRows(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0, 1, 2])
  })

  it('should only shift rows', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(2, adr("A2"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))

    index.removeRows(RowsSpan.fromNumberOfRows(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0, 1])
  })

  it('should only shift rows 2', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(2, adr("A2"))
    index.add(2, adr("A3"))
    index.add(1, adr("A4"))

    index.removeRows(RowsSpan.fromNumberOfRows(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0, 1])
  })
})

describe('ColumnIndex#addColumns', () => {

  it('should shift columns when adding columns', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(1, adr("B1"))
    index.add(1, adr("C1"))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0])
    expect(index.getValueIndex(0, 3, 1)).toEqual([0])
    expect(index.getValueIndex(0, 4, 1)).toEqual([0])
  })
})

describe('ColumnIndex#removeColumns', () => {
  it('should remove column', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1)).toEqual([])
  })

  it('should work when empty index', () => {
    const index = new ColumnIndex(new Statistics())

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1)).toEqual([])
  })

  it('should remove multiple columns in the middle ', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1"))
    index.add(2, adr("B1"))
    index.add(3, adr("C1"))
    index.add(4, adr("D1"))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1)).toEqual([0])
    expect(index.getValueIndex(0, 1, 4)).toEqual([0])
    expect(index.getValueIndex(0, 2, 3)).toEqual([])
    expect(index.getValueIndex(0, 3, 4)).toEqual([])
  })

  it('should remove columns only in one sheet ', () => {
    const index = new ColumnIndex(new Statistics())
    index.add(1, adr("A1", 0))
    index.add(1, adr("A1", 1))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1)).toEqual([])
    expect(index.getValueIndex(1, 0, 1)).toEqual([0])
  })
})
