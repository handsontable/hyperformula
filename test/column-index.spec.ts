import {deepStrictEqual} from 'assert'
import {CellError, HyperFormula, LazilyTransformingAstService} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {ErrorType, simpleCellAddress} from '../src/Cell'
import {ColumnIndex} from '../src/ColumnSearch/ColumnIndex'
import {NamedExpressions} from '../src/NamedExpressions'
import {ColumnsSpan} from '../src/ColumnsSpan'
import {Config} from '../src/Config'
import {Matrix, MatrixSize} from '../src/Matrix'
import {RowsSpan} from '../src/RowsSpan'
import {Statistics} from '../src/statistics'
import {adr} from './testUtils'
import {AddRowsTransformer} from '../src/dependencyTransformers/AddRowsTransformer'
import {RemoveRowsTransformer} from '../src/dependencyTransformers/RemoveRowsTransformer'
import {DependencyGraph} from '../src/DependencyGraph'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {SimpleRangeValue} from '../src/interpreter/InterpreterValue'

function buildEmptyIndex(transformingService: LazilyTransformingAstService, config: Config, statistics: Statistics): ColumnIndex {
  const functionRegistry = new FunctionRegistry(config)
  const namedExpression = new NamedExpressions()
  const dependencyGraph = DependencyGraph.buildEmpty(transformingService, config, functionRegistry, namedExpression, statistics)
  return new ColumnIndex(dependencyGraph, config, statistics)
}

describe('ColumnIndex#add', () => {
  const statistics = new Statistics()
  const transformingService = new LazilyTransformingAstService(statistics)

  it('should add value to empty index', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('B5'))

    const columnMap = index.getColumnMap(0, 1)

    expect(columnMap.size).toBe(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(columnMap.get(1)!.index[0]).toBe(4)
  })

  it('should keep values in sorted order', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A3'))
    index.add(1, adr('A5'))
    index.add(1, adr('A1'))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(columnMap.get(1)!.index[0]).toBe(0)
  })

  it('should not store duplicates', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A5'))
    index.add(1, adr('A5'))
    index.add(1, adr('A1'))
    index.add(1, adr('A1'))

    const columnMap = index.getColumnMap(0, 0)

    expect(columnMap.size).toBe(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(columnMap.get(1)!.index.length).toBe(2)
  })

  it('should ignore CellErrors', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    const error = new CellError(ErrorType.DIV_BY_ZERO)

    index.add(error, adr('A1'))

    const columnMap = index.getColumnMap(0, 0)
    expect(columnMap.size).toBe(0)
    expect(columnMap.keys()).not.toContain(error)
  })

  it('should ignore SimpleRangeValue', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    const simpleRangeValue = SimpleRangeValue.onlyNumbersDataWithoutRange([[1]], new MatrixSize(1, 1))

    index.add(simpleRangeValue, adr('A1'))

    const columnMap = index.getColumnMap(0, 0)
    expect(columnMap.size).toBe(0)
  })
})

describe('ColumnIndex change/remove', () => {
  const statistics = new Statistics()
  const transformingService = new LazilyTransformingAstService(statistics)

  it('should remove value from index', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A2'))
    index.add(1, adr('A3'))

    index.remove(1, simpleCellAddress(0, 0, 1))

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.index.length).toBe(2)
    expect(valueIndex.index).toContain(0)
    expect(valueIndex.index).toContain(2)
  })

  it('should do nothing if passed value is null', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A2'))
    index.add(1, adr('A3'))

    index.remove(null, simpleCellAddress(0, 0, 1))

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.index.length).toBe(3)
    expect(valueIndex.index).toContain(0)
    expect(valueIndex.index).toContain(1)
    expect(valueIndex.index).toContain(2)
  })

  it('should change value in index', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    index.change(1, 2, simpleCellAddress(0, 0, 0))

    expect(index.getColumnMap(0, 0).keys()).not.toContain(1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valueIndex = index.getColumnMap(0, 0).get(2)!
    expect(valueIndex.index).toContain(0)
  })

  it('should do nothing when changing to the same value', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    const spyRemove = spyOn(index, 'remove')
    const spyAdd = spyOn(index, 'add')

    index.change(1, 1, simpleCellAddress(0, 0, 0))

    expect(spyRemove).not.toHaveBeenCalled()
    expect(spyAdd).not.toHaveBeenCalled()
  })

  it('should change matrix values', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    const matrix = new Matrix([
      [1, 2],
      [3, 4],
    ])
    index.add(matrix, simpleCellAddress(0, 0, 0))
    deepStrictEqual(index.getColumnMap(0, 0), new Map([
      [1, {index: [0], version: 0}],
      [3, {index: [1], version: 0}],
    ]))
    deepStrictEqual(index.getColumnMap(0, 1), new Map([
      [2, {index: [0], version: 0}],
      [4, {index: [1], version: 0}],
    ]))

    index.change(matrix, new Matrix([
      [5, 6],
      [7, 8],
    ]), simpleCellAddress(0, 0, 0))

    deepStrictEqual(index.getColumnMap(0, 0), new Map([
      [5, {index: [0], version: 0}],
      [7, {index: [1], version: 0}],
    ]))
    deepStrictEqual(index.getColumnMap(0, 1), new Map([
      [6, {index: [0], version: 0}],
      [8, {index: [1], version: 0}],
    ]))
  })

  it('should ignore CellErrors', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    const error = new CellError(ErrorType.DIV_BY_ZERO)
    index.change(1, error, simpleCellAddress(0, 0, 0))

    expect(index.getColumnMap(0, 0).keys()).not.toContain(1)
    expect(index.getColumnMap(0, 0).keys()).not.toContain(error)
  })
})

describe('ColumnIndex#addColumns', () => {
  const statistics = new Statistics()
  const transformingService = new LazilyTransformingAstService(statistics)

  it('should add column to index', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])
  })

  it('should add columns in the middle', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('B1'))
    index.add(1, adr('C1'))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 3, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 4, 1).index).toEqual([0])
  })

  it('should add columns only in one sheet', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('B1'))
    index.add(1, adr('B1', 1))

    index.addColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 1, 1).index).toEqual([])
    expect(index.getValueIndex(0, 3, 1).index).toEqual([0])
    expect(index.getValueIndex(1, 1, 1).index).toEqual([0])
  })
})

describe('ColumnIndex#removeColumns', () => {
  const statistics = new Statistics()
  const transformingService = new LazilyTransformingAstService(statistics)

  it('should remove column', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should work when empty index', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should remove multiple columns in the middle ', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(2, adr('B1'))
    index.add(3, adr('C1'))
    index.add(4, adr('D1'))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 1, 2))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 1, 4).index).toEqual([0])
    expect(index.getValueIndex(0, 2, 3).index).toEqual([])
    expect(index.getValueIndex(0, 3, 4).index).toEqual([])
  })

  it('should remove columns only in one sheet ', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1', 0))
    index.add(1, adr('A1', 1))

    index.removeColumns(ColumnsSpan.fromNumberOfColumns(0, 0, 1))

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
    expect(index.getValueIndex(1, 0, 1).index).toEqual([0])
  })
})

describe('ColumnIndex#find', () => {
  const stats = new Statistics()
  const transformService = new LazilyTransformingAstService(stats)

  it('should find row number', function() {
    const index = buildEmptyIndex(transformService, new Config(), stats)

    index.add(1, adr('A2'))
    const row = index.find(1, new AbsoluteCellRange(adr('A1'), adr('A3')), true)

    expect(row).toBe(1)
  })

  it('should find smallest row number for value', function() {
    const index = buildEmptyIndex(transformService, new Config(), stats)

    index.add(1, adr('A4'))
    index.add(1, adr('A10'))
    const row = index.find(1, new AbsoluteCellRange(adr('A1'), adr('A20')), true)

    expect(row).toBe(3)
  })
})

describe('ColumnIndex#addRows', () => {
  it('should add row', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(2, adr('B3'))

    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))
    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(1, 0, 1)))

    index.ensureRecentData(0, 0, 1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    index.ensureRecentData(0, 1, 2)
    expect(index.getValueIndex(0, 1, 2).index).toEqual([3])
  })

  it('should not shift row', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 1)))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
  })

  it('should add rows in the middle', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A2'))
    index.add(1, adr('A3'))
    index.add(1, adr('A4'))

    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 2)))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 3, 4, 5])
  })

  it('should add rows for all columns', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A2'))
    index.add(1, adr('B2'))
    index.add(2, adr('C2'))

    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 2)))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 1, 1)
    index.ensureRecentData(0, 2, 2)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([3])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([3])
    expect(index.getValueIndex(0, 2, 2).index).toEqual([3])
  })

  it('should add rows for different values', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(2, adr('A2'))
    index.add(3, adr('A3'))
    index.add(4, adr('B1'))
    index.add(4, adr('B5'))

    transformingService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 2)))
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
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([])
  })

  it('should remove rows in the middle ', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A2'))
    index.add(1, adr('A3'))
    index.add(1, adr('A4'))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 2)))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 1])
  })

  it('should remove rows in every column', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A2'))
    index.add(1, adr('B2'))
    index.add(1, adr('C2'))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(0, 1, 1)
    index.ensureRecentData(0, 2, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])
    expect(index.getValueIndex(0, 2, 1).index).toEqual([0])
  })

  it('should remove rows for different values', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A2'))
    index.add(2, adr('A3'))
    index.add(3, adr('A4'))
    index.add(4, adr('B3'))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 2)))
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
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A2'))
    index.add(1, adr('A2', 1))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))
    index.ensureRecentData(0, 0, 1)
    index.ensureRecentData(1, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0])
    expect(index.getValueIndex(1, 0, 1).index).toEqual([1])
  })

  it('should remove proper rows', () => {
    const statistics = new Statistics()
    const transformingService = new LazilyTransformingAstService(statistics)
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A3'))
    index.add(1, adr('A4'))
    index.add(1, adr('A6'))

    transformingService.addTransformation(new RemoveRowsTransformer(RowsSpan.fromNumberOfRows(0, 1, 4)))
    index.ensureRecentData(0, 0, 1)

    expect(index.getValueIndex(0, 0, 1).index).toEqual([0, 1])
  })
})

describe('ColumnIndex - lazy cruds', () => {
  it('should add rows only in specific column after find', function() {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = buildEmptyIndex(transformService, new Config(), stats)
    index.add(1, adr('A1'))
    index.add(1, adr('B1'))

    transformService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))

    const rowA = index.find(1, new AbsoluteCellRange(adr('A1'), adr('A2')), true)
    expect(rowA).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])

    const rowB = index.find(1, new AbsoluteCellRange(adr('B1'), adr('B2')), true)
    expect(rowB).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([1])
  })

  it('should add rows only for specific value after find', function() {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = buildEmptyIndex(transformService, new Config(), stats)
    index.add(1, adr('A1'))
    index.add(2, adr('A2'))

    transformService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))

    const row1 = index.find(1, new AbsoluteCellRange(adr('A1'), adr('A3')), true)
    expect(row1).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([1])

    const row2 = index.find(2, new AbsoluteCellRange(adr('A1'), adr('A3')), true)
    expect(row2).toEqual(2)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([2])
  })
})
