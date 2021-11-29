import {deepStrictEqual} from 'assert'
import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType} from '../src/Cell'
import {Config} from '../src/Config'
import {DependencyGraph} from '../src/DependencyGraph'
import {AddRowsTransformer} from '../src/dependencyTransformers/AddRowsTransformer'
import {RemoveRowsTransformer} from '../src/dependencyTransformers/RemoveRowsTransformer'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {EmptyValue} from '../src/interpreter/InterpreterValue'
import {SimpleRangeValue} from '../src/interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from '../src/LazilyTransformingAstService'
import {ColumnIndex} from '../src/Lookup/ColumnIndex'
import {NamedExpressions} from '../src/NamedExpressions'
import {ColumnsSpan, RowsSpan} from '../src/Span'
import {Statistics} from '../src/statistics'
import {adr, expectColumnIndexToMatchSheet} from './testUtils'

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

  it('should add values from SimpleRangeValue', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    const simpleRangeValue = SimpleRangeValue.onlyNumbers([[1, 2]])

    index.add(simpleRangeValue, adr('A1'))

    const columnA = index.getColumnMap(0, 0)
    const columnB = index.getColumnMap(0, 1)

    expect(columnA.size).toBe(1)
    expect(columnB.size).toBe(1)
  })

  it('should handle strings correctly', () => {
    const index = buildEmptyIndex(transformingService, new Config({
      caseSensitive: false,
      accentSensitive: false
    }), statistics)
    index.add('a', adr('A1'))
    index.add('A', adr('A2'))
    index.add('ą', adr('A3'))

    // Some strings don't have a canonical form, so for them, the index is created as usual.
    index.add('l', adr('A4'))
    index.add('ł', adr('A5'))
    index.add('t', adr('A6'))
    index.add('ŧ', adr('A7'))

    const columnMap = index.getColumnMap(0, 0)

    // eslint-disable @typescript-eslint/no-non-null-assertion
    expect(columnMap.get('a')!.index.length).toBe(3)
    expect(columnMap.get('l')!.index.length).toBe(1)
    expect(columnMap.get('ł')!.index.length).toBe(1)
    expect(columnMap.get('t')!.index.length).toBe(1)
    expect(columnMap.get('ŧ')!.index.length).toBe(1)
    // eslint-enable @typescript-eslint/no-non-null-assertion
  })

  it('should ignore EmptyValue', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(EmptyValue, adr('A1'))
    expect(index.getColumnMap(0, 0).size).toBe(0)
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

    index.remove(1, adr('A2'))

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valueIndex = index.getColumnMap(0, 0).get(1)!
    expect(valueIndex.index.length).toBe(2)
    expect(valueIndex.index).toContain(0)
    expect(valueIndex.index).toContain(2)
  })

  it('should do nothing if passed value is undefined', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))
    index.add(1, adr('A2'))
    index.add(1, adr('A3'))

    index.remove(undefined, adr('A2'))

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

    index.change(1, 2, adr('A1'))

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

    index.change(1, 1, adr('A1'))

    expect(spyRemove).not.toHaveBeenCalled()
    expect(spyAdd).not.toHaveBeenCalled()
  })

  it('should change range values', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    const range = SimpleRangeValue.onlyNumbers([
      [1, 2],
      [3, 4],
    ])
    index.add(range, adr('A1'))
    deepStrictEqual(index.getColumnMap(0, 0), new Map([
      [1, {index: [0], version: 0}],
      [3, {index: [1], version: 0}],
    ]))
    deepStrictEqual(index.getColumnMap(0, 1), new Map([
      [2, {index: [0], version: 0}],
      [4, {index: [1], version: 0}],
    ]))

    index.change(range, SimpleRangeValue.onlyNumbers([
      [5, 6],
      [7, 8],
    ]), adr('A1'))

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
    index.change(1, error, adr('A1'))

    expect(index.getColumnMap(0, 0).keys()).not.toContain(1)
    expect(index.getColumnMap(0, 0).keys()).not.toContain(error)
  })

  it('should ignore EmptyValue', () => {
    const index = buildEmptyIndex(transformingService, new Config(), statistics)
    index.add(1, adr('A1'))

    index.change(1, EmptyValue, adr('A1'))

    expect(index.getColumnMap(0, 0).size).toBe(0)
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

  it('should find row number', () => {
    const index = buildEmptyIndex(transformService, new Config(), stats)

    index.add(1, adr('A2'))
    const row = index.find(1, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('A1'), adr('A3')), undefined!), true)

    expect(row).toBe(1)
  })

  it('should find smallest row number for value', () => {
    const index = buildEmptyIndex(transformService, new Config(), stats)

    index.add(1, adr('A4'))
    index.add(1, adr('A10'))
    const row = index.find(1, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('A1'), adr('A20')), undefined!), true)

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
  it('should add rows only in specific column after find', () => {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = buildEmptyIndex(transformService, new Config(), stats)
    index.add(1, adr('A1'))
    index.add(1, adr('B1'))

    transformService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))

    const rowA = index.find(1, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('A1'), adr('A2')), undefined!), true)
    expect(rowA).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([0])

    const rowB = index.find(1, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('B1'), adr('B2')), undefined!), true)
    expect(rowB).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 1, 1).index).toEqual([1])
  })

  it('should add rows only for specific value after find', () => {
    const stats = new Statistics()
    const transformService = new LazilyTransformingAstService(stats)
    const index = buildEmptyIndex(transformService, new Config(), stats)
    index.add(1, adr('A1'))
    index.add(2, adr('A2'))

    transformService.addTransformation(new AddRowsTransformer(RowsSpan.fromNumberOfRows(0, 0, 1)))

    const row1 = index.find(1, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('A1'), adr('A3')), undefined!), true)
    expect(row1).toEqual(1)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([1])

    const row2 = index.find(2, SimpleRangeValue.onlyRange(new AbsoluteCellRange(adr('A1'), adr('A3')), undefined!), true)
    expect(row2).toEqual(2)
    expect(index.getValueIndex(0, 0, 1).index).toEqual([1])
    expect(index.getValueIndex(0, 0, 2).index).toEqual([2])
  })
})

describe('Arrays', () => {
  it('should update column index with array values', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    expectColumnIndexToMatchSheet([
      [1, 2, -1, -2]
    ], engine)
  })

  it('should remove values from index when REF', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.setCellContents(adr('D1'), [['foo']])

    expectColumnIndexToMatchSheet([
      [1, 2, null, 'foo']
    ], engine)
  })

  it('should remove values from index when replacing array with scalar', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.setCellContents(adr('C1'), [['foo']])

    expectColumnIndexToMatchSheet([
      [1, 2, 'foo']
    ], engine)
  })

  it('should remove values when replacing array with smaller one', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.setCellContents(adr('C1'), [['=2*A1:A1']])

    expectColumnIndexToMatchSheet([
      [1, 2, 2]
    ], engine)
  })

  it('shoud remove values when replacing array with parsing error', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.setCellContents(adr('C1'), [['=SUM(']])

    expectColumnIndexToMatchSheet([
      [1, 2]
    ], engine)
  })

  it('should update index when replacing array with another one', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B1'],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.setCellContents(adr('C1'), [['=2*A1:B1']])

    expectColumnIndexToMatchSheet([
      [1, 2, 2, 4]
    ], engine)
  })

  it('should move array values when adding rows above array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B3:B4'],
      [null, 'foo'],
      [null, 1],
      [null, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.addRows(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [null],
      [-1],
      [-2, 'foo'],
      [null, 1],
      [null, 2],
    ], engine)
  })

  it('should not move array values when adding rows', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B3:B4'],
      [null, 'foo'],
      [-2, 1],
      [-1, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.addRows(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [-1],
      [-2],
      [null, 'foo'],
      [-2, 1],
      [-1, 2],
    ], engine)
  })

  it('should move array values when removing rows above array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [],
      ['=-B3:B4'],
      [null, 1],
      [null, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeRows(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [-1],
      [-2, 1],
      [null, 2]
    ], engine)
  })

  it('should not move array values when removing rows', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B4:B5'],
      [null],
      [null, 'foo'],
      [-2, 1],
      [-1, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeRows(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [-1],
      [-2, 'foo'],
      [-2, 1],
      [-1, 2],
    ], engine)
  })

  it('should remove array values from index when removing row with left corner', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [null, 1],
      [null, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeRows(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [null, 1],
      [null, 2]
    ], engine)
  })

  it('should remove array values from index when REF after removing rows', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [null, 1],
      [3, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeRows(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [],
      [3, 2]
    ], engine)
  })

  it('should move array values when adding columns before array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C2:D2'],
      [null, 'foo', 1, 2]
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.addColumns(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [null, -1, -2],
      [null, null, 'foo', 1, 2]
    ], engine)
  })

  it('should not move array values when adding columns', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C2:E2', null, null, -3, -2, -1],
      [null, 'foo', 1, 2, 3]
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.addColumns(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [-1, -2, -3, null, -3, -2, -1],
      [null, null, 'foo', 1, 2, 3]
    ], engine)
  })

  it('should move array values when removing columns before array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=-C2:D2'],
      [null, null, 1, 2]
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeColumns(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [-1, -2],
      [null, 1, 2]
    ], engine)
  })

  it('should not move array values when removing columns', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-D2:E2', null, null, -2, -1],
      [-2, 'foo', null, 1, 2]
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeColumns(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [-1, -2, -2, -1],
      [-2, null, 1, 2]
    ], engine)
  })

  it('should remove array values from index when removing column with left corner', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B2:C2'],
      [null, 1, 2],
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeColumns(0, [0, 1])

    expectColumnIndexToMatchSheet([
      [],
      [1, 2],
    ], engine)
  })

  it('should remove array values from index when REF after removing columns', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-B2:C2', null, 1],
      [2, null, 3]
    ], {useArrayArithmetic: true, useColumnIndex: true})

    engine.removeColumns(0, [1, 1])

    expectColumnIndexToMatchSheet([
      [null, 1],
      [2, 3]
    ], engine)
  })
})
