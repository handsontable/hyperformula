import {ExportedCellChange, HyperFormula, InvalidArgumentsError} from '../../src'
import {ErrorType, simpleCellAddress} from '../../src/Cell'
import {CellAddress} from '../../src/parser'
import {
  adr, colEnd,
  colStart,
  detailedError, extractColumnRange,
  extractRange,
  extractReference,
  extractRowRange,
  rowEnd,
  rowStart,
} from '../testUtils'

describe('Ensure it is possible to move rows', () => {
  it('should return false when target makes no sense', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2']
    ])

    expect(engine.isItPossibleToMoveRows(0, 0, 1, -1)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 2, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 2, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 2, 2)).toEqual(false)
  })

  it('should not be possible to move rows when sheet does not exists', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveRows(1, 0, 1, 2)).toEqual(false)
  })

  it('should not be possible to move rows when number of rows is non-positive', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    expect(engine.isItPossibleToMoveRows(0, 0, 0, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, -5, 1)).toEqual(false)
  })

  it('should be possible to move rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['0'],
      ['1'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveRows(0, 1, 1, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveRows(0, 1, 1, 3)).toEqual(true)
    expect(engine.isItPossibleToMoveRows(0, 1, 1, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveRows(0, 1, 2, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveRows(0, 1, 2, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveRows(0, 1, 2, 5)).toEqual(true)
  })

  it('should not be possible to move row with formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(engine.isItPossibleToMoveRows(0, 1, 1, 5)).toBe(false)
    expect(engine.isItPossibleToMoveRows(0, 1, 2, 5)).toBe(false)
  })

  it('should not be possible to move row inside formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      [''],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(engine.isItPossibleToMoveRows(0, 0, 1, 2)).toBe(true)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 3)).toBe(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 4)).toBe(true)
  })
})

describe('Move rows', () => {
  it('should throw error when target makes no sense', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2']
    ])

    expect(() => engine.moveRows(0, 0, 1, -1)).toThrow(new InvalidArgumentsError('row number to be nonnegative and number of rows to add to be positive.'))
    expect(() => engine.moveRows(0, 0, 1, 1)).toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    expect(() => engine.moveRows(0, 0, 1, 0)).toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    expect(() => engine.moveRows(0, 0, 2, 0)).toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    expect(() => engine.moveRows(0, 0, 2, 1)).toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    expect(() => engine.moveRows(0, 0, 2, 2)).toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
  })

  it('should move one row', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 1, 1, 3)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move row when moving upward', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 2, 1, 1)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move multiple rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    engine.moveRows(0, 0, 3, 4)

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('should work when moving multiple rows far away', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
    ])

    engine.moveRows(0, 1, 2, 5)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(3)
  })

  it('should adjust reference when swapping formula with dependency ', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    engine.moveRows(0, 1, 1, 0)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(null, 0, 1))
  })

  it('should adjust absolute references', () => {
    const engine = HyperFormula.buildFromArray([
      ['=$A$2', '=B2']
    ])

    engine.moveRows(0, 0, 1, 2)

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.absolute(null, 0, 0))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.relative(null, 0, -1))
  })

  it('should adjust range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])

    engine.moveRows(0, 1, 1, 3)
    const range = extractRange(engine, adr('B3'))

    expect(range.start.row).toEqual(0)
    expect(range.end.row).toEqual(2)
    expect(engine.getCellValue(adr('B3'))).toEqual(1)
  })

  it('should return changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])

    const changes = engine.moveRows(0, 1, 1, 3)

    expect(changes.length).toEqual(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress( 0, 1, 2), 1 ))
  })

  it('should return #CYCLE when moving formula onto referred range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
      ['=AVERAGE(A1:A3)'],
    ])

    engine.moveRows(0, 3, 1, 1)

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.CYCLE))
  })
})

describe('Move rows - row ranges', () => {
  it('should adjust relative references of dependent formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    engine.moveRows(0, 1, 2, 4)

    const range = extractRowRange(engine, adr('A1'))
    expect(range.start).toEqual(rowStart(3))
    expect(range.end).toEqual(rowEnd(4))
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should adjust relative dependencies of moved formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    engine.moveRows(0, 0, 1, 3)

    const range = extractRowRange(engine, adr('A3'))
    expect(range.start).toEqual(rowStart(1))
    expect(range.end).toEqual(rowEnd(2))
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('should return #CYCLE when moving formula onto referred range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    engine.moveRows(0, 0, 1, 2)

    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellFormula(adr('A2'))).toEqual('=SUM(1:3)')
  })
})

describe('Move rows - column ranges', () => {
  it('should not affect moved column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2'],
    ])

    engine.moveRows(0, 0, 1, 2)

    const range = extractColumnRange(engine, adr('A2'))
    expect(range.start).toEqual(colStart('B'))
    expect(range.end).toEqual(colEnd('C'))
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('should not affect dependent column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2'],
      [null, '3', '4'],
    ])

    engine.moveRows(0, 1, 1, 3)

    const range = extractColumnRange(engine, adr('A1'))
    expect(range.start).toEqual(colStart('B'))
    expect(range.end).toEqual(colEnd('C'))
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })
})
