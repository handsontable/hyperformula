import {CellError, EmptyValue, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {InvalidArgumentsError} from '../../src'
import {CellAddress} from '../../src/parser'
import {adr, detailedError, extractRange, extractReference} from '../testUtils'

describe("Ensure it is possible to move columns", () => {
  it('should return false when target makes no sense', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 1, -1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 2)).toEqual(false)
  })

  it('should not be possible to move columns when sheet does not exists', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(1, 0, 1, 2)).toEqual(false)
  })

  it('should not be possible to move columns when number of columns is non-positive', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 0, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, -5, 1)).toEqual(false)
  })

  it('should be possible to move columns', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 3)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 5)).toEqual(true)
  })

  it('should not be possible to move row with formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '{=TRANSPOSE(A1:A2)}', '{=TRANSPOSE(A1:A2)}'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 5)).toBe(false)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 5)).toBe(false)
  })

  it('should not be possible to move row inside formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '', '{=TRANSPOSE(A1:A2)}', '{=TRANSPOSE(A1:A2)}'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 2)).toBe(true)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 3)).toBe(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 4)).toBe(true)
  })
})

describe("Move columns", () => {
  it('should throw error when target makes no sense', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(() => engine.moveColumns(0, 0, 1, -1)).toThrowError(new InvalidArgumentsError())
    expect(() => engine.moveColumns(0, 0, 1, 1)).toThrowError(new InvalidArgumentsError())
    expect(() => engine.moveColumns(0, 0, 1, 0)).toThrowError(new InvalidArgumentsError())
    expect(() => engine.moveColumns(0, 0, 2, 0)).toThrowError(new InvalidArgumentsError())
    expect(() => engine.moveColumns(0, 0, 2, 1)).toThrowError(new InvalidArgumentsError())
    expect(() => engine.moveColumns(0, 0, 2, 2)).toThrowError(new InvalidArgumentsError())
  })

  it('should move one column', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    engine.moveColumns(0, 1, 1, 3)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
  })

  it('should move column when moving to left', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    engine.moveColumns(0, 2, 1, 1)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
  })

  it('should move multiple columns', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    engine.moveColumns(0, 0, 3, 4)

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(3)
  })

  it('should work when moving multiple columns far away', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3']
    ])

    engine.moveColumns(0, 1, 2, 5)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('C1'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('E1'))).toEqual(3)
  })

  it('should adjust reference when swapping formula with dependency ', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.moveColumns(0, 1, 1, 0)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('should adjust absolute references', () => {
    const engine = HyperFormula.buildFromArray([
      ['=$B$1'],
      ['=B2']
    ])

    engine.moveColumns(0, 0, 1, 2)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.absolute(0, 0, 0))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.relative(0, -1, 0))
  })

  it('should adjust range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1' , '2'],
      ['',  '=COUNTBLANK(A1:B1)'],
    ])

    engine.moveColumns(0, 1, 1, 3)
    const range = extractRange(engine, adr('C2'))

    expect(range.start.col).toEqual(0)
    expect(range.end.col).toEqual(2)
    expect(engine.getCellValue(adr('C2'))).toEqual(1)
  })

  it('should return changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['1' , '2'],
      ['',  '=COUNTBLANK(A1:B1)'],
    ])

    const changes = engine.moveColumns(0, 1, 1, 3)

    expect(changes.length).toEqual(1)
    expect(changes).toContainEqual({ sheet: 0, col: 2, row: 1, value: 1 })
  })

  it('should return #CYCLE when moving formula onto referred range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '=SUM(A1:C1)', '=AVERAGE(A1:C1)']
    ])

    engine.moveColumns(0, 3, 1, 1)

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('E1'))).toEqual(detailedError(ErrorType.CYCLE))
  })
})
