import {ColumnIndex} from "../src/ColumnIndex";
import {adr} from "./testUtils";
import {Statistics} from "../src/statistics/Statistics";
import {simpleCellAddress} from "../src/Cell";
import {RowsSpan} from "../src/RowsSpan";
import {ColumnsSpan} from "../src/ColumnsSpan";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";
import {LazilyTransformingAstService} from "../src";

describe("ColumnIndex#add", () => {
  it('should add value to empty index', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("B5"))

    const columnMap = index.getColumnMap(0, 1)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)!.index[0]).toBe(4)
  });

  it('should keep values in sorted order', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A3"))
    index.add(1, adr("A5"))
    index.add(1, adr("A1"))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)!.index[0]).toBe(0)
  });

  it('should not store duplicates', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A5"))
    index.add(1, adr("A5"))
    index.add(1, adr("A1"))
    index.add(1, adr("A1"))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    expect(columnMap.get(1)!.index.length).toBe(2)
  });
})

describe('ColumnIndex change/remove', () => {
  it('should remove value from index', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))

    index.remove(1, simpleCellAddress(0, 0, 1))

    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.index.length).toBe(2)
    expect(valueIndex.index).toContain(0)
    expect(valueIndex.index).toContain(2)
  })

  it('should do nothing if passed value is null', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))

    index.remove(null, simpleCellAddress(0, 0, 1))

    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.index.length).toBe(3)
    expect(valueIndex.index).toContain(0)
    expect(valueIndex.index).toContain(1)
    expect(valueIndex.index).toContain(2)
  })

  it('should change value in index', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    index.change(1, 2, simpleCellAddress(0, 0, 0))

    expect(index.getColumnMap(0, 0).keys()).not.toContain(1)
    const valueIndex = index.getColumnMap(0, 0).get(2)!
    expect(valueIndex.index).toContain(0)
  })

  it('should do nothing when changing to the same value', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    const spyRemove = spyOn(index, "remove")
    const spyAdd = spyOn(index, "add")

    index.change(1, 1, simpleCellAddress(0, 0, 0))

    expect(spyRemove).not.toHaveBeenCalled()
    expect(spyAdd).not.toHaveBeenCalled()
  })
})

describe('ColumnIndex#addColumns', () => {
  it('should add column to index', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])
  })

  it('should add columns in the middle', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("B1"))
    index.add(1, adr("C1"))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 3, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 4, 1).index).toEqual([0])
  })

  it('should add columns only in one sheet', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("B1"))
    index.add(1, adr("B1", 1))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 1, 1).index).toEqual([])
    expect(index.getValueIndex(0, 3, 1).index).toEqual([0])
    expect(index.getValueIndex(1, 1, 1).index).toEqual([0])
  })
})

describe('ColumnIndex#removeColumns', () => {
  it('should remove column', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should work when empty index', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should remove multiple columns in the middle ', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(2, adr("B1"))
    index.add(3, adr("C1"))
    index.add(4, adr("D1"))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 1, 4).index).toEqual([0])
    expect(index.getValueIndex(0, 2, 3).index).toEqual([])
    expect(index.getValueIndex(0, 3, 4).index).toEqual([])
  })

  it('should remove columns only in one sheet ', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1", 0))
    index.add(1, adr("A1", 1))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
    expect(index.getValueIndex(1, 0, 1).index).toEqual([0])
  })
})

describe('ColumnIndex#find', () => {
  const stats = new Statistics()
  const transformService = new LazilyTransformingAstService(stats)
  it('should find row number', function () {
    const index = new ColumnIndex(stats, transformService)

    index.add(1, adr("A2"))
    const row = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A3")))

    expect(row).toBe(1)
  })

  it('should find smallest row number for value', function () {
    const index = new ColumnIndex(stats, transformService)

    index.add(1, adr("A4"))
    index.add(1, adr("A10"))
    const row = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A20")))

    expect(row).toBe(3)
  });

  it('should not find anything in empty index', function () {
    const index = new ColumnIndex(stats, transformService)

    const row = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A20")))

    expect(row).toBe(-1)
  });

  it('should not find anything in empty column', function () {
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("B2"))

    const row = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A20")))

    expect(row).toBe(-1)
  });

  it('should not find anything if value occurs before range', function () {
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("A1"))

    const row = index.find(1, new AbsoluteCellRange(adr("A2"), adr("A5")))

    expect(row).toBe(-1)
  });

  it('should not find anything if value occurs after range', function () {
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("A10"))

    const row = index.find(1, new AbsoluteCellRange(adr("A2"), adr("A9")))

    expect(row).toBe(-1)
  });

  it('should not find anything if value in different sheet', function () {
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("A5", 1))

    const row = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A10")))

    expect(row).toBe(-1)
  });
})

describe('ColumnIndex#addRows', () => {
  it('should add row', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(2, adr("B3"))

    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))
    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(1, 0, 1))

    index.ensureRecentData(0, 0, 1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    index.ensureRecentData(0, 1, 2)
    expect(index.getValueIndex(0, 1, 2).index).toEqual([3])
  })

  it('should not shift row', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 1))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
  })

  it('should add rows in the middle', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))

    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 2))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 3, 4, 5])
  })

  it('should add rows for all columns', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A2"))
    index.add(1, adr("B2"))
    index.add(2, adr("C2"))

    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 2))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 1, 1)
    index.ensureRecentData(0, 2, 2)


    expect(index.getValueIndex(0, 0, 1).index).toEqual([3])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([3])
    expect(index.getValueIndex(0, 2, 2).index).toEqual([3])
  })

  it('should add rows for different values', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(2, adr("A2"))
    index.add(3, adr("A3"))
    index.add(4, adr("B1"))
    index.add(4, adr("B5"))

    transformingService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 2))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 0, 2)
    index.ensureRecentData(0, 0, 3)
    index.ensureRecentData(0, 1, 4)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([3])
    expect(index.getValueIndex(0, 0, 3).index).toEqual([4])
    expect(index.getValueIndex(0, 1, 4).index).toEqual([0, 6])
  })
})

describe('ColumnIndex#removeRows', () => {
  it('should remove rows', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should remove rows in the middle ', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A2"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 2))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 1])
  })

  it('should remove rows in every column', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A2"))
    index.add(1, adr("B2"))
    index.add(1, adr("C2"))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 1, 1)
    index.ensureRecentData(0, 2, 1)


    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 2, 1).index).toEqual([0])
  })

  it('should remove rows for different values', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A2"))
    index.add(2, adr("A3"))
    index.add(3, adr("A4"))
    index.add(4, adr("B3"))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 2))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 0, 2)
    index.ensureRecentData(0, 0, 3)
    index.ensureRecentData(0, 1, 4)



    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([0])
    expect(index.getValueIndex(0, 0, 3).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 4).index).toEqual([0])
  })

  it('should remove rows only in one sheet', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A2"))
    index.add(1, adr("A2", 1))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(1, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(1, 0, 1).index).toEqual([1])
  })

  it('should remove proper rows', () => {
    const stats = new Statistics()
    const transformingService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformingService)
    index.add(1, adr("A1"))
    index.add(1, adr("A3"))
    index.add(1, adr("A4"))
    index.add(1, adr("A6"))

    transformingService.addRemoveRowsTransformation(RowsSpan.fromNumberOfRows(0, 1, 4))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 1])
  })
})


describe('ColumnIndex - lazy cruds', () => {
  it('should add rows only in specific column after find', function () {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("A1"))
    index.add(1, adr("B1"))

    transformService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))

    const rowA = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A2")))
    expect(rowA).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])

    const rowB = index.find(1, new AbsoluteCellRange(adr("B1"), adr("B2")))
    expect(rowB).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([1])
  });

  it('should add rows only for specific value after find', function () {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = new ColumnIndex(stats, transformService)
    index.add(1, adr("A1"))
    index.add(2, adr("A2"))

    transformService.addAddRowsTransformation(RowsSpan.fromNumberOfRows(0, 0, 1))

    const row1 = index.find(1, new AbsoluteCellRange(adr("A1"), adr("A3")))
    expect(row1).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([1])

    const row2 = index.find(2, new AbsoluteCellRange(adr("A1"), adr("A3")))
    expect(row2).toEqual(2)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([2])
  });
})
