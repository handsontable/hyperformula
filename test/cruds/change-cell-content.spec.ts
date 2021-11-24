import {ErrorType, ExportedCellChange, HyperFormula, InvalidAddressError, NoSheetWithIdError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ArraySize} from '../../src/ArraySize'
import {simpleCellAddress} from '../../src/Cell'
import {Config} from '../../src/Config'
import {ArrayVertex, EmptyCellVertex, ValueCellVertex} from '../../src/DependencyGraph'
import {ErrorMessage} from '../../src/error-message'
import {SheetSizeLimitExceededError} from '../../src/errors'
import {ColumnIndex} from '../../src/Lookup/ColumnIndex'
import {
  adr,
  colEnd,
  colStart,
  detailedError,
  expectArrayWithSameContent,
  expectEngineToBeTheSameAs,
  expectVerticesOfTypes,
  noSpace,
  rowEnd,
  rowStart
} from '../testUtils'

describe('Changing cell content - checking if its possible', () => {
  it('address should have valid coordinates', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(simpleCellAddress(0, -1, 0))).toEqual(false)
  })

  it('address should be in existing sheet', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(adr('A1', 1))).toEqual(false)
  })

  it('yes if there is an array', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=TRANSPOSE(A1:B2)'],
      [],
      ['13'],
    ])

    expect(engine.isItPossibleToSetCellContents(adr('A3'))).toBe(true)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(adr('A3'), 1, 1))).toBe(true)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))).toBe(true)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(adr('A2'), 2, 2))).toBe(true)
  })

  it('no if content exceeds sheet size limits', async() => {
const engine = await HyperFormula.buildFromArray([])
    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns - 1, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows - 1)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(cellInLastColumn, 1, 1))).toEqual(true)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(cellInLastColumn, 2, 1))).toEqual(false)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(cellInLastRow, 1, 1))).toEqual(true)
    expect(engine.isItPossibleToSetCellContents(AbsoluteCellRange.spanFrom(cellInLastRow, 1, 2))).toEqual(false)
  })

  it('yes otherwise', async() => {
const engine = await HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(adr('A1'))).toEqual(true)
  })
})

describe('changing cell content', () => {
  it('update formula vertex', async() => {
    const sheet = [
      ['1', '2', '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    let c1 = engine.addressMapping.fetchCell(adr('C1'))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(1)

    await engine.setCellContents(adr('C1'), [['=B1']])

    c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('update formula to number cell vertex', async() => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    await engine.setCellContents(adr('B1'), [['7']])
    expect(engine.getCellValue(adr('B1'))).toBe(7)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update formula to plain text cell vertex', async() => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    await engine.setCellContents(adr('B1'), [['foo']])
    expect(engine.getCellValue(adr('B1'))).toBe('foo')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('set vertex with edge to empty cell', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    await engine.setCellContents(adr('A1'), [[null]])

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, a2)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe(null)
  })

  it('update formula to empty cell', async() => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    await engine.setCellContents(adr('B1'), [[null]])
    expect(engine.getCellValue(adr('B1'))).toBe(null)
    expect(engine.graph.nodes).not.toContain(b1)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update value cell to formula', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    let b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(2)
    await engine.setCellContents(adr('B1'), [['=A1']])

    b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('update value cell to value cell', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    expect(engine.getCellValue(adr('B1'))).toBe(2)
    await engine.setCellContents(adr('B1'), [['3']])
    expect(engine.getCellValue(adr('B1'))).toBe(3)
  })

  it('update value cell to value cell with the same value', async() => {
    const sheet = [
      ['1', '2', '=SUM(A1:B1)'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const b1 = engine.addressMapping.getCell(adr('B1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1setCellValueSpy = spyOn(b1 as any, 'setCellValue')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')

    await engine.setCellContents(adr('B1'), [['2']])

    expect(b1setCellValueSpy).not.toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('update value cell to empty', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    expect(engine.getCellValue(adr('B1'))).toBe(2)
    await engine.setCellContents(adr('B1'), null)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(undefined)
    expect(engine.getCellValue(adr('B1'))).toBe(null)
  })

  it('update value cell to error literal', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])

    await engine.setCellContents(adr('A1'), '#DIV/0!')

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('update value cell to error-like literal', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])

    await engine.setCellContents(adr('A1'), '#FOO!')

    expect(engine.getCellValue(adr('A1'))).toEqual('#FOO!')
  })

  it('update value cell to invalid formula', async() => {
const engine = await HyperFormula.buildFromArray([[1]])

    await engine.setCellContents(adr('A1'), '=SUM(')

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(')
  })

  it('changing value inside range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue(adr('B3'))).toEqual(6)

    await engine.setCellContents({sheet: 0, col: 0, row: 0}, '3')
    expect(engine.getCellValue(adr('B3'))).toEqual(8)
  })

  it('changing value inside column range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '0', '=SUM(A:B)'],
    ])
    expect(engine.getCellValue(adr('C3'))).toEqual(6)

    await engine.setCellContents({sheet: 0, col: 1, row: 0}, '3')
    expect(engine.getCellValue(adr('C3'))).toEqual(9)
  })

  it('changing value inside row range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['=SUM(1:2)'],
    ])
    expect(engine.getCellValue(adr('A3'))).toEqual(3)

    await engine.setCellContents({sheet: 0, col: 1, row: 0}, '3')
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
  })

  it('set formula for the first time', async() => {
    const sheet = [
      ['42', ''],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(42)
  })

  it('set nothing again', async() => {
    const sheet = [
      [null],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), null)
    const a1 = engine.addressMapping.getCell(adr('A1'))
    expect(a1).toBe(undefined)
    expect(engine.getCellValue(adr('A1'))).toBe(null)
  })

  it('set number for the first time', async() => {
    const sheet = [
      [null],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), '7')

    expect(engine.getCellValue(adr('A1'))).toBe(7)
  })

  it('set text for the first time', async() => {
    const sheet = [
      [null],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), 'foo')

    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('change empty to formula', async() => {
    const sheet = [
      ['42', null, '=B1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(42)
    expect(engine.getCellValue(adr('C1'))).toBe(42)
  })

  it('set nothing again', async() => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), null)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('change EMPTY to NUMBER', async() => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), '7')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe(7)
  })

  it('change EMPTY to TEXT', async() => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), 'foo')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('ensure that only part of the tree is evaluated', async() => {
    const sheet = [
      ['1', '2'],
      ['=A1', '=B1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const b2 = engine.addressMapping.getCell(adr('B2'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a2setCellValueSpy = spyOn(a2 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b2setCellValueSpy = spyOn(b2 as any, 'setCellValue')

    await engine.setCellContents(adr('A1'), '3')
    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(b2setCellValueSpy).not.toHaveBeenCalled()
  })

  it('is not possible to set cell content in sheet which does not exist', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    expect(async() => {
      await engine.setCellContents(adr('B1', 1), '3')
    }).rejects.toThrow(new NoSheetWithIdError(1))
  })

  it('is not possible to set cell content with invalid address', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    const address = {row: -1, col: 0, sheet: 0}
    expect(async() => {
      await engine.setCellContents(address, '3')
    }).rejects.toThrow(new InvalidAddressError(address))
  })

  it('remembers if the new formula is structure dependent', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=TRUE()'],
      ['1'],
    ])

    await engine.setCellContents(adr('C1'), '=COLUMNS(A1:B1)')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = spyOn(c1 as any, 'setCellValue')
    await engine.removeRows(0, [1, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('returns cell value change', async() => {
    const sheet = [
      ['1'],
    ]

    const engine = await HyperFormula.buildFromArray(sheet)

    const changes = await engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A1'), 2))
  })

  it('returns dependent formula value change', async() => {
    const sheet = [
      ['1', '=A1'],
    ]

    const engine = await HyperFormula.buildFromArray(sheet)

    const changes = await engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(2)
    expect(changes[0]).toMatchObject(new ExportedCellChange(adr('A1'), 2))
    expect(changes[1]).toMatchObject(new ExportedCellChange(adr('B1'), 2))
  })

  it('returns dependent matrix value changes', async() => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['=MMULT(A1:B2,A1:B2)'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    const changes = await engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(5)
    expectArrayWithSameContent(changes.map((change) => change.newValue), [2, 10, 12, 18, 22])
  })

  it('update empty cell to parsing error ', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.setCellContents(adr('A1'), '=SUM(')

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('update dependecy value cell to parsing error ', async() => {
    const sheet = [
      ['1', '=SUM(A1)'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), '=SUM(')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('update formula cell to parsing error ', async() => {
    const sheet = [
      ['1', '=SUM(A1)'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), '=SUM(')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('update parsing error to formula', async() => {
    const sheet = [
      ['1', '=SUM('],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), '=SUM(A1)')

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('update empty cell to unparsable matrix formula', async() => {
const engine = await HyperFormula.buildFromArray([])

    await engine.setCellContents(adr('A1'), '=TRANSPOSE(')

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=TRANSPOSE(')
  })

  it('should throw when trying to set cell content outside sheet limits', async() => {
const engine = await HyperFormula.buildFromArray([])
    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows)

    expect(async() => await engine.setCellContents(cellInLastColumn, '1')).toThrow(new SheetSizeLimitExceededError())
    expect(async() => await engine.setCellContents(cellInLastRow, '1')).toThrow(new SheetSizeLimitExceededError())
  })

  it('setting empty cells outside sheet limits does not produce error', async() => {
const engine = await HyperFormula.buildFromArray([])
    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows)

    expect(async() => await engine.setCellContents(cellInLastColumn, null)).not.toThrow()
    expect(async() => await engine.setCellContents(cellInLastRow, null)).not.toThrow()
  })

  it('should set matrix with range out of current sheet scope', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setCellContents(adr('C1'), '=MMULT(A1:B2,A1:B2)')
  })
})

describe('change multiple cells contents', () => {
  it('works for one', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), [['3']])
    expect(engine.getCellValue(adr('B1'))).toBe(3)
  })

  it('works for many', async() => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('B1'), [
      ['12', '13'],
      ['15', '16'],
      ['18', '19'],
    ])
    expect(engine.getCellValue(adr('B1'))).toBe(12)
    expect(engine.getCellValue(adr('C1'))).toBe(13)
    expect(engine.getCellValue(adr('B2'))).toBe(15)
    expect(engine.getCellValue(adr('C2'))).toBe(16)
    expect(engine.getCellValue(adr('B3'))).toBe(18)
    expect(engine.getCellValue(adr('C3'))).toBe(19)
  })

  it('recompute only once', async() => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evaluatorCallSpy = spyOn(engine.evaluator as any, 'partialRun')

    await engine.setCellContents(adr('B1'), [
      ['12', '13'],
      ['15', '16'],
      ['18', '19'],
    ])

    expect(evaluatorCallSpy).toHaveBeenCalledTimes(1)
  })

  it('possible to change matrices', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    await engine.setCellContents(adr('A1'), [['42', '18', '=MMULT(A1:B1,TRANSPOSE(A1:B1))']])
    expect(engine.getCellValue(adr('A1'))).toBe(42)
    expect(engine.getCellValue(adr('B1'))).toBe(18)
    expect(engine.getCellValue(adr('C1'))).toBe(2088)
  })

  it('returns changes of multiple values', async() => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    const changes = await engine.setCellContents(adr('A1'), [['7', '8'], ['9', '10']])

    expect(changes.length).toEqual(4)
    expectArrayWithSameContent(changes.map((change) => change.newValue), [7, 8, 9, 10])
  })

  it('returns changes of multiple values dependent formulas', async() => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B1)', '=SUM(B1:B2)'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)

    const changes = await engine.setCellContents(adr('A1'), [['7', '8'], ['9', '10']])

    expect(changes.length).toEqual(6)
    expectArrayWithSameContent(changes.map((change) => change.newValue), [7, 8, 9, 10, 15, 18])
  })

  it('should throw when trying to set cell contents outside sheet limits', async() => {
const engine = await HyperFormula.buildFromArray([])
    const cellInLastColumn = simpleCellAddress(0, Config.defaultConfig.maxColumns - 1, 0)
    const cellInLastRow = simpleCellAddress(0, 0, Config.defaultConfig.maxRows - 1)

    expect(async() => await engine.setCellContents(cellInLastColumn, [['1', '2']])).toThrow(new SheetSizeLimitExceededError())
    expect(async() => await engine.setCellContents(cellInLastRow, [['1'], ['2']])).toThrow(new SheetSizeLimitExceededError())
  })
})

describe('updating column index', () => {
  it('should update column index when changing simple value', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '15'],
    ], {useColumnIndex: true})

    await engine.setCellContents(adr('B2'), '8')

    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 15).index, [])
    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 8).index, [1])
  })

  it('should update column index when clearing cell content', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ], {useColumnIndex: true})

    await engine.setCellContents(adr('B1'), null)

    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 2).index, [])
  })

  it('should update column index when changing to ParsingError', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ], {useColumnIndex: true})

    await engine.setCellContents(adr('B1'), '=SUM(')

    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 2).index, [])
  })

  it('should update column index when changing to formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ], {useColumnIndex: true})

    await engine.setCellContents(adr('B1'), '=SUM(A1)')

    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 2).index, [])
    expectArrayWithSameContent((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 1).index, [0])
  })
})

describe('column ranges', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    await engine.setCellContents(adr('A1'), '3')

    expect(engine.getCellValue(adr('C1'))).toEqual(5)
  })

  it('works when new content is added beyond previous sheet size', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    await engine.setCellContents(adr('A2'), '3')

    const range = engine.rangeMapping.fetchRange(colStart('A'), colEnd('B'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    expect(engine.graph.existsEdge(a2, range)).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(6)
  })

  it('works when adding matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(B:C)'],
      ['1'],
      ['2'],
    ])

    await engine.setCellContents(adr('B1'), '=TRANSPOSE(A2:A3)')

    const range = engine.rangeMapping.fetchRange(colStart('B'), colEnd('C'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(b1, range)).toEqual(true)
    expect(engine.graph.existsEdge(c1, range)).toEqual(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })
})

describe('row ranges', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(1:2)']
    ])

    await engine.setCellContents(adr('A1'), '3')

    expect(engine.getCellValue(adr('A3'))).toEqual(5)
  })

  it('works when new content is added beyond previous sheet size', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(1:2)']
    ])

    await engine.setCellContents(adr('B1'), '3')

    const range = engine.rangeMapping.fetchRange(rowStart(1), rowEnd(2))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(b1, range)).toEqual(true)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
  })

  it('works when adding matrix', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(2:3)', '1', '2'],
    ])

    await engine.setCellContents(adr('A2'), '=TRANSPOSE(B1:C1)')

    const range = engine.rangeMapping.fetchRange(rowStart(2), rowEnd(3))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a3 = engine.addressMapping.fetchCell(adr('A3'))
    expect(engine.graph.existsEdge(a2, range)).toEqual(true)
    expect(engine.graph.existsEdge(a3, range)).toEqual(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })
})

describe('arrays', () => {
  it('should set array to cell', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('C1'), [['=-A1:B2']])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2, '=-A1:B2'],
      [3, 4],
    ], {useArrayArithmetic: true}))
  })

  it('should be REF array if no space for result', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [1],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A1'), [['=-B2:B3']])

    expect(engine.getCellValue(adr('A1'))).toEqual(noSpace())
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [1],
    ], {useArrayArithmetic: true}))
  })

  it('should be REF array if no space and potential cycle', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [1],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A1'), [['=-A2:A3']])

    expect(engine.getCellValue(adr('A1'))).toEqual(noSpace())
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['=-A2:A3'],
      [1],
    ], {useArrayArithmetic: true}))
  })

  it('should shrink to one vertex if there is more content colliding with array', async() => {
const engine = await HyperFormula.buildFromArray([], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A1'), [
      ['=-C1:D2'],
      [1]
    ])

    expect(engine.arrayMapping.getArrayByCorner(adr('A1'))?.array.size).toEqual(ArraySize.error())
    expectVerticesOfTypes(engine, [
      [ArrayVertex, undefined],
      [ValueCellVertex, undefined],
    ])
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [1, null]
    ], {useArrayArithmetic: true}))
  })

  it('should be separate arrays', async() => {
const engine = await HyperFormula.buildFromArray([], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A1'), [
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
    ])

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex, undefined],
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [undefined, ArrayVertex, ArrayVertex],
    ])
    expect(engine.arrayMapping.arrayMapping.size).toEqual(4)
    expect(engine.getSheetValues(0))
  })

  it('should REF last array', async() => {
const engine = await HyperFormula.buildFromArray([
      [null, null, null, 1, 2],
      [null, null, null, 1, 2],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A1'), [
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)'],
    ])

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [undefined, undefined],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1, 1, 1, 2],
      [noSpace(), 2, 2, 1, 2],
    ])
    expect(engine.arrayMapping.arrayMapping.size).toEqual(3)
    expect(engine.getSheetValues(0))
  })

  it('should make existing array REF and change cell content to simple value', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '=B4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B4'), [['foo']])

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2],
      [3, 4, 'foo'],
      [noSpace()],
      [null, 'foo']
    ])
  })

  it('should not change cell to empty if part of an array', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '=B4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B4'), [[null]])

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2],
      [3, 4, -4],
      [-1, -2],
      [-3, -4],
    ])
  })

  it('should make existing array REF and change cell content to formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '=B4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B4'), [['=SUM(A1:B2)']])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4, '=B4'],
      ['=-A1:B2'],
      [undefined, '=SUM(A1:B2)']
    ], {useArrayArithmetic: true}))
    expect(engine.getSheetValues(0)).toEqual([
      [1, 2],
      [3, 4, 10],
      [noSpace()],
      [null, 10]
    ])
  })

  it('should make existing array REF and change cell content to parsing error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '=B4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B4'), [['=SUM(']])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2],
      [3, 4, '=B4'],
      ['=-A1:B2'],
      [null, '=SUM(']
    ], {useArrayArithmetic: true}))
  })

  it('should make existing matrix REF and set new array', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4', '=B4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B3'), [['=+A1:B2']])

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2],
      [3, 4, 3],
      [noSpace(), 1, 2],
      [null, 3, 4]
    ])
  })

  it('should replace one array with another', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=-A1:B2'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('A3'), [['=2*A1:B2']])

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2],
      [3, 4],
      [2, 4],
      [6, 8],
    ])
  })

  it('should adjust dependent formulas after shrinking array', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1', null, null, 4],
      ['=D1', '=E1', '=SUM(E1, F1:G1)'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('E1'), [['foo']])
    await engine.setCellContents(adr('D1'), [[4, 5, 6]])

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2, 3, 4, 5, 6, 4],
      ['=D1', '=E1', '=SUM(E1, F1:G1)']
    ], {useArrayArithmetic: true}))
  })

  it('should adjust dependent ranges after shrinking array taking smaller vertices into account', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, '=-A1:A3', '=SUM(B1:B2)', '=SUM(B1:B3)'],
      [2],
      [3],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('B1'), 'foo')
    await engine.setCellContents(adr('B1'), [[4], [5], [6]])

    const b1 = engine.dependencyGraph.getCell(adr('b1'))!
    const b2 = engine.dependencyGraph.getCell(adr('b2'))!
    const b3 = engine.dependencyGraph.getCell(adr('b3'))!
    const b1b2 = engine.rangeMapping.getRange(adr('b1'), adr('b2'))!
    const b1b3 = engine.rangeMapping.getRange(adr('b1'), adr('b3'))!

    expect(engine.graph.existsEdge(b1, b1b2)).toBe(true)
    expect(engine.graph.existsEdge(b2, b1b2)).toBe(true)
    expect(engine.graph.existsEdge(b1b2, b1b3)).toBe(true)
    expect(engine.graph.existsEdge(b1, b1b3)).toBe(false)
    expect(engine.graph.existsEdge(b2, b1b3)).toBe(false)
    expect(engine.graph.existsEdge(b3, b1b3)).toBe(true)

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 4, '=SUM(B1:B2)', '=SUM(B1:B3)'],
      [2, 5],
      [3, 6],
    ], {useArrayArithmetic: true}))
  })

  it('should return values of a range in changes', async() => {
const engine = await HyperFormula.buildFromArray([[1, 2]], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('A2'), [['=-A1:B1']])

    expect(changes.length).toEqual(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), -1))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), -2))
  })

  it('should return changed content when replacing array left corner', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['=-A1:B1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('A2'), [['foo']])

    expect(changes.length).toEqual(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), 'foo'))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), null))
  })

  it('should return changed content when replacing any array cell with simple value', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['=-A1:C1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('B2'), [['foo']])

    expect(changes.length).toEqual(3)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), noSpace()))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), 'foo'))
    expect(changes).toContainEqual(new ExportedCellChange(adr('C2'), null))
  })

  it('should return changed content when replacing any array cell with parsing error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['=-A1:C1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('B2'), [['=SUM(']])

    expect(changes.length).toEqual(3)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), noSpace()))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), detailedError(ErrorType.ERROR, ErrorMessage.ParseError)))
    expect(changes).toContainEqual(new ExportedCellChange(adr('C2'), null))
  })

  it('should return changed content when clearing array left corner', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['=-A1:B1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('A2'), null)

    expect(changes.length).toEqual(2)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), null))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), null))
  })

  it('should return no changes when trying to clear array cell', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['=-A1:B1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('B2'), null)

    expect(changes.length).toEqual(0)
  })

  it('should return changed content when replacing array to another smaller one', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['=-A1:C1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('A2'), [['=+A1:B1']])

    expect(changes.length).toEqual(3)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), 1))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), 2))
    expect(changes).toContainEqual(new ExportedCellChange(adr('C2'), null))
  })

  it('should return changed content when replacing array to smaller one even if values are same', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['=-A1:C1'],
    ], { useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('A2'), [['=-A1:B1']])

    expect(changes.length).toEqual(3)
    expect(changes).toContainEqual(new ExportedCellChange(adr('A2'), -1))
    expect(changes).toContainEqual(new ExportedCellChange(adr('B2'), -2))
    expect(changes).toContainEqual(new ExportedCellChange(adr('C2'), null))
  })

  it('should return REF in changes', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1'],
    ], {useArrayArithmetic: true})

    const changes = await engine.setCellContents(adr('E1'), [['foo']])

    expect(changes).toContainEqual(new ExportedCellChange(adr('D1'), noSpace()))
    expect(changes).toContainEqual(new ExportedCellChange(adr('E1'), 'foo'))
    expect(changes).toContainEqual(new ExportedCellChange(adr('F1'), null))
  })

  it('should undo REF', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1', null, null, 4],
      ['=D1', '=E1', '=SUM(F1:F1)', '=SUM(F1:G1)'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('E1'), [['foo']])
    await engine.setCellContents(adr('D1'), [[4, 5, 6]])
    await engine.undo()
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1', null, null, 4],
      ['=D1', '=E1', '=SUM(F1:F1)', '=SUM(F1:G1)'],
    ], {useArrayArithmetic: true}))

    expect(engine.getCellValue(adr('A2'))).toEqual(-1)
    expect(engine.getCellValue(adr('B2'))).toEqual(-2)
    expect(engine.getCellValue(adr('C2'))).toEqual(-3)
    expect(engine.getCellValue(adr('D2'))).toEqual(1)
  })

  it('should redo REF', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1', null, null, 4],
      ['=D1', '=E1', '=SUM(F1:F1)', '=SUM(F1:G1)'],
    ], {useArrayArithmetic: true})

    await engine.setCellContents(adr('E1'), [['foo']])
    await engine.undo()
    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([
      [1, 2, 3, '=-A1:C1', 'foo', null, 4],
      ['=D1', '=E1', '=SUM(F1:F1)', '=SUM(F1:G1)'],
    ], {useArrayArithmetic: true}))
  })

  xit('should recalculate matrix if space is available', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=+C1:D1', 'foo', 1, 2]
    ], {useArrayArithmetic: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(noSpace())

    await engine.setCellContents(adr('B1'), null)

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2, 1, 2]
    ])
  })
})
