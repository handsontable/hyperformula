import {ExportedCellChange, HyperFormula, InvalidArgumentsError} from '../../src'
import {ErrorType} from '../../src/Cell'
import {CellAddress} from '../../src/parser'
import {
  adr,
  colEnd,
  colStart,
  detailedError,
  extractColumnRange,
  extractReference,
  extractRowRange,
  rowEnd,
  rowStart,
} from '../testUtils'

describe('Ensure it is possible to move rows', () => {
  it('should return false when target makes no sense', async() => {
const engine = await HyperFormula.buildFromArray([
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

  it('should not be possible to move rows when sheet does not exists', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveRows(1, 0, 1, 2)).toEqual(false)
  })

  it('should not be possible to move rows when number of rows is non-positive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])

    expect(engine.isItPossibleToMoveRows(0, 0, 0, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveRows(0, 0, -5, 1)).toEqual(false)
  })

  it('should be possible to move rows', async() => {
const engine = await HyperFormula.buildFromArray([
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

  it('should not be possible to move row with formula matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(engine.isItPossibleToMoveRows(0, 1, 1, 5)).toBe(false)
    expect(engine.isItPossibleToMoveRows(0, 1, 2, 5)).toBe(false)
  })

  it('should not be possible to move row inside formula matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      [''],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(engine.isItPossibleToMoveRows(0, 0, 1, 2)).toBe(true)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 3)).toBe(false)
    expect(engine.isItPossibleToMoveRows(0, 0, 1, 4)).toBe(true)
  })
})

describe('Move rows', () => {
  it('should throw error when target makes no sense', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2']
    ])

    await expect((async() => await engine.moveRows(0, 0, 1, -1))()).rejects.toThrow(new InvalidArgumentsError('row number to be nonnegative and number of rows to add to be positive.'))
    await expect((async() => await engine.moveRows(0, 0, 1, 1))()).rejects.toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    await expect((async() => await engine.moveRows(0, 0, 1, 0))()).rejects.toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    await expect((async() => await engine.moveRows(0, 0, 2, 0))()).rejects.toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    await expect((async() => await engine.moveRows(0, 0, 2, 1))()).rejects.toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
    await expect((async() => await engine.moveRows(0, 0, 2, 2))()).rejects.toThrow(new InvalidArgumentsError('a valid range of rows to move.'))
  })

  it('should move one row', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    await engine.moveRows(0, 1, 1, 3)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move row when moving upward', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    await engine.moveRows(0, 2, 1, 1)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(4)
  })

  it('should move multiple rows', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])

    await engine.moveRows(0, 0, 3, 4)

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
    expect(engine.getCellValue(adr('A4'))).toEqual(3)
  })

  it('should work when moving multiple rows far away', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
    ])

    await engine.moveRows(0, 1, 2, 5)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(engine.getCellValue(adr('A4'))).toEqual(2)
    expect(engine.getCellValue(adr('A5'))).toEqual(3)
  })

  it('should adjust reference when swapping formula with dependency ', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['=A1'],
    ])

    await engine.moveRows(0, 1, 1, 0)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0))
  })

  it('should adjust absolute references', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=$A$2', '=B2']
    ])

    await engine.moveRows(0, 0, 1, 2)

    expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.absolute( 0, 0))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.relative(-1, 0))
  })

  it('should adjust range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2', '=COUNTBLANK(A1:A2)'],
    ])

    await engine.moveRows(0, 1, 1, 3)

    expect(engine.getCellFormula(adr('B3'))).toEqual('=COUNTBLANK(A1:A1)')
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
  })

  it('should return changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      [null, '=COUNTBLANK(A1:A2)'],
    ])

    const changes = await engine.moveRows(0, 1, 1, 3)

    expect(changes.length).toEqual(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('B3'), 0))
  })

  it('should return #CYCLE when moving formula onto referred range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(A1:A3)'],
      ['=AVERAGE(A1:A3)'],
    ])

    await engine.moveRows(0, 3, 1, 1)

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('should produce only one history entry', async() => {
const engine = await HyperFormula.buildFromArray([[0], [1], [2], [3]])

    const version = engine.lazilyTransformingAstService.version()

    await engine.moveRows(0, 1, 1, 3)

    expect(engine.lazilyTransformingAstService.version()).toEqual(version + 1)
  })
})

describe('Move rows - row ranges', () => {
  it('should adjust relative references of dependent formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    await engine.moveRows(0, 1, 2, 4)

    const range = extractRowRange(engine, adr('A1'))
    expect(range.start).toEqual(rowStart(3))
    expect(range.end).toEqual(rowEnd(4))
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should adjust relative dependencies of moved formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    await engine.moveRows(0, 0, 1, 3)

    const range = extractRowRange(engine, adr('A3'))
    expect(range.start).toEqual(rowStart(1))
    expect(range.end).toEqual(rowEnd(2))
    expect(engine.getCellValue(adr('A3'))).toEqual(3)
  })

  it('should return #CYCLE when moving formula onto referred range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    await engine.moveRows(0, 0, 1, 2)

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellFormula(adr('A2'))).toEqual('=SUM(1:3)')
  })
})

describe('Move rows - column ranges', () => {
  it('should not affect moved column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2'],
    ])

    await engine.moveRows(0, 0, 1, 2)

    const range = extractColumnRange(engine, adr('A2'))
    expect(range.start).toEqual(colStart('B'))
    expect(range.end).toEqual(colEnd('C'))
    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('should not affect dependent column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2'],
      [null, '3', '4'],
    ])

    await engine.moveRows(0, 1, 1, 3)

    const range = extractColumnRange(engine, adr('A1'))
    expect(range.start).toEqual(colStart('B'))
    expect(range.end).toEqual(colEnd('C'))
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })
})
