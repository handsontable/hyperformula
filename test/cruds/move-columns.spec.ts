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
  rowStart
} from '../testUtils'

describe('Ensure it is possible to move columns', () => {
  it('should return false when target makes no sense', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 1, -1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 0)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 2, 2)).toEqual(false)
  })

  it('should not be possible to move columns when sheet does not exists', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(1, 0, 1, 2)).toEqual(false)
  })

  it('should not be possible to move columns when number of columns is non-positive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 0, 1)).toEqual(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, -5, 1)).toEqual(false)
  })

  it('should be possible to move columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['0', '1', '2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 3)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 0)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 4)).toEqual(true)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 5)).toEqual(true)
  })

  it('should not be possible to move row with formula matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=TRANSPOSE(A1:A2)'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 1, 1, 5)).toBe(false)
    expect(engine.isItPossibleToMoveColumns(0, 1, 2, 5)).toBe(false)
  })

  it('should not be possible to move row inside formula matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '', '=TRANSPOSE(A1:A2)'],
      ['2'],
    ])

    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 2)).toBe(true)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 3)).toBe(false)
    expect(engine.isItPossibleToMoveColumns(0, 0, 1, 4)).toBe(true)
  })
})

describe('Move columns', () => {
  it('should throw error when target makes no sense', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ])

    expect(async() => await engine.moveColumns(0, 0, 1, -1)).rejects.toThrow(new InvalidArgumentsError('column number to be nonnegative and number of columns to add to be positive.'))
    expect(async() => await engine.moveColumns(0, 0, 1, 1)).rejects.toThrow(new InvalidArgumentsError('a valid range of columns to move.'))
    expect(async() => await engine.moveColumns(0, 0, 1, 0)).rejects.toThrow(new InvalidArgumentsError('a valid range of columns to move.'))
    expect(async() => await engine.moveColumns(0, 0, 2, 0)).rejects.toThrow(new InvalidArgumentsError('a valid range of columns to move.'))
    expect(async() => await engine.moveColumns(0, 0, 2, 1)).rejects.toThrow(new InvalidArgumentsError('a valid range of columns to move.'))
    expect(async() => await engine.moveColumns(0, 0, 2, 2)).rejects.toThrow(new InvalidArgumentsError('a valid range of columns to move.'))
  })

  it('should move one column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    await engine.moveColumns(0, 1, 1, 3)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
  })

  it('should move column when moving to left', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    await engine.moveColumns(0, 2, 1, 1)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(4)
  })

  it('should move multiple columns', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4']
    ])

    await engine.moveColumns(0, 0, 3, 4)

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(2)
    expect(engine.getCellValue(adr('D1'))).toEqual(3)
  })

  it('should work when moving multiple columns far away', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3']
    ])

    await engine.moveColumns(0, 1, 2, 5)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toBe(null)
    expect(engine.getCellValue(adr('C1'))).toBe(null)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('E1'))).toEqual(3)
  })

  it('should adjust reference when swapping formula with dependency ', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=A1'],
      ['=B2', '1'],
    ])

    await engine.moveColumns(0, 1, 1, 0)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.relative(0, -1))
  })

  it('should adjust absolute references', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=$B$1'],
      ['=B2']
    ])

    await engine.moveColumns(0, 0, 1, 2)

    expect(extractReference(engine, adr('B1'))).toEqual(CellAddress.absolute( 0, 0))
    expect(extractReference(engine, adr('B2'))).toEqual(CellAddress.relative(0, -1))
  })

  it('should adjust range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['', '=COUNTBLANK(A1:B1)'],
    ])

    await engine.moveColumns(0, 1, 1, 3)

    expect(engine.getCellFormula(adr('C2'))).toEqual('=COUNTBLANK(A1:A1)')
    expect(engine.getCellValue(adr('C2'))).toEqual(0)
  })

  it('should return changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', null],
      ['', '=COUNTBLANK(A1:B1)'],
    ])

    const changes = await engine.moveColumns(0, 1, 1, 3)

    expect(changes.length).toEqual(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('C2'), 0))
  })

  it('should return #CYCLE when moving formula onto referred range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '=AVERAGE(A1:C1)', '=SUM(A1:C1)']
    ])

    await engine.moveColumns(0, 3, 1, 1)

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('E1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('should work with moving formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4', '=SUM(A1:C1)']
    ])

    await engine.moveColumns(0, 3, 1, 1)

    expect(engine.getCellValue(adr('E1'))).toEqual(10)
  })

  it('should return #CYCLE when moving formula onto referred range, simple case', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B1:C1)', '1', '2']
    ])

    await engine.moveColumns(0, 0, 1, 2)

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellFormula(adr('B1'))).toEqual('=SUM(A1:C1)')
  })

  it('should produce only one history entry', async() => {
const engine = await HyperFormula.buildFromArray([[0, 1, 2, 3]])

    const version = engine.lazilyTransformingAstService.version()

    await engine.moveColumns(0, 1, 1, 3)

    expect(engine.lazilyTransformingAstService.version()).toEqual(version + 1)
  })
})

describe('Move columns - column ranges', () => {
  it('should adjust relative references of dependent formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2']
    ])

    await engine.moveColumns(0, 1, 2, 4)

    const range = extractColumnRange(engine, adr('A1'))
    expect(range.start).toEqual(colStart('C'))
    expect(range.end).toEqual(colEnd('D'))
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should adjust relative dependencies of moved formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2']
    ])

    await engine.moveColumns(0, 0, 1, 3)

    const range = extractColumnRange(engine, adr('C1'))
    expect(range.start).toEqual(colStart('A'))
    expect(range.end).toEqual(colEnd('B'))
    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })

  it('should return #CYCLE when moving formula onto referred range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)', '1', '2']
    ])

    await engine.moveColumns(0, 0, 1, 2)

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellFormula(adr('B1'))).toEqual('=SUM(A:C)')
  })
})

describe('Move columns - row ranges', () => {
  it('should not affect moved row range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1'],
      ['2']
    ])

    await engine.moveColumns(0, 0, 1, 2)

    const range = extractRowRange(engine, adr('B1'))
    expect(range.start).toEqual(rowStart(2))
    expect(range.end).toEqual(rowEnd(3))
    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })

  it('should not affect dependent row range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)'],
      ['1', '3'],
      ['2', '4']
    ])

    await engine.moveColumns(0, 1, 1, 3)

    const range = extractRowRange(engine, adr('A1'))
    expect(range.start).toEqual(rowStart(2))
    expect(range.end).toEqual(rowEnd(3))
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })
})
