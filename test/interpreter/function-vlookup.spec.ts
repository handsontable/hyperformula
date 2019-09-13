import {CellError, Config, HandsOnEngine} from "../../src";
import {ErrorType} from "../../src/Cell";
import '../testConfig.ts'

describe('VLOOKUP - args validation', () => {
  it('not enough parameters', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('to many parameters', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, 2, TRUE(), "foo")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NA))
  })

  it('wrong type of first argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(D1:D2, A2:B3, 2, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of second argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, "foo", 2, TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of third argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, "foo", TRUE())'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('wrong type of fourth argument', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, 2, "bar")'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('should return error when index argument greater that range width', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=VLOOKUP(1, A2:B3, 3)'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.REF))
  })
})

describe('VLOOKUP', () => {
  it('should find value in sorted range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['4', 'd'],
      ['5', 'e'],
      ['=VLOOKUP(2, A1:B5, 2)'],
    ], new Config({vlookupThreshold: 1}))

    expect(engine.getCellValue('A6')).toEqual('b')
  })

  it('should find value in sorted range using linearSearch', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['4', 'd'],
      ['5', 'e'],
      ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
    ])

    expect(engine.getCellValue('A6')).toEqual('b')
  })

  it('should find value in unsorted range using linearSearch', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['5', 'a'],
      ['4', 'b'],
      ['3', 'c'],
      ['2', 'd'],
      ['1', 'e'],
      ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
    ])

    expect(engine.getCellValue('A6')).toEqual('d')
  })

  it('should find value in unsorted range using linearSearch', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['5', 'a'],
      ['4', 'b'],
      ['3', 'c'],
      ['2', 'd'],
      ['1', 'e'],
      ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
    ])

    expect(engine.getCellValue('A6')).toEqual('d')
  })

  it('should find value in sorted range with different types', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['=TRUE()', 'd'],
      ['foo', 'e'],
      ['=VLOOKUP(TRUE(), A1:B5, 2, FALSE())'],
    ], new Config({vlookupThreshold: 1}))

    expect(engine.getCellValue('A6')).toEqual('d')
  })

  it('should find value in unsorted range with different types', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=TRUE()', 'a'],
      ['4', 'b'],
      ['foo', 'c'],
      ['2', 'd'],
      ['bar', 'e'],
      ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
    ])

    expect(engine.getCellValue('A6')).toEqual('d')
  })

  xit('should return lower bound for sorted values', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['=VLOOKUP(4, A1:B3, 2, TRUE())'],
    ], new Config({vlookupThreshold: 1}))

    expect(engine.getCellValue('A4')).toEqual('c')
  })

  it('should return error when all values are greater', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['=VLOOKUP(0, A1:B3, 2, TRUE())'],
    ], new Config({vlookupThreshold: 1}))

    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.NA))
  })

  it('should return error when value not present using linear search', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['=VLOOKUP(4, A1:B3, 2, FALSE())'],
    ])

    expect(engine.getCellValue('A4')).toEqual(new CellError(ErrorType.NA))
  })

  it('should find value if index build during evaluation', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A2', 'a'],
      ['1', 'b'],
      ['2', 'c'],
      ['=VLOOKUP(1, A1:B3, 2, TRUE())']
    ], new Config({vlookupThreshold: 1}))

    expect(engine.getCellValue('A4')).toEqual('a')
  })
})
