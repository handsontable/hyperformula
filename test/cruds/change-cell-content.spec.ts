import {EmptyValue, ExportedCellChange, HyperFormula, InvalidAddressError, NoSheetWithIdError} from '../../src'
import {ErrorType, simpleCellAddress} from '../../src/Cell'
import {ColumnIndex} from '../../src/ColumnSearch/ColumnIndex'
import {EmptyCellVertex, MatrixVertex} from '../../src/DependencyGraph'
import '../testConfig'
import {adr, colEnd, colStart, detailedError, rowEnd, rowStart} from '../testUtils'

describe('Changing cell content - checking if its possible', () => {
  it('address should have valid coordinates', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(simpleCellAddress(0, -1, 0))).toEqual(false)
  })

  it('address should be in existing sheet', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(adr('A1', 1))).toEqual(false)
  })

  it('no if in formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(engine.isItPossibleToSetCellContents(adr('A3'))).toBe(false)
    expect(engine.isItPossibleToSetCellContents(adr('A3'), 1, 1)).toBe(false)
    expect(engine.isItPossibleToSetCellContents(adr('A1'), 2, 2)).toBe(true)
    expect(engine.isItPossibleToSetCellContents(adr('A2'), 2, 2)).toBe(false)
  })

  it('yes if numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})
    expect(engine.matrixMapping.matrixMapping.size).toEqual(1)

    expect(engine.isItPossibleToSetCellContents(adr('A2'))).toBe(true)
  })

  it('yes otherwise', () => {
    const engine = HyperFormula.buildFromArray([[]])

    expect(engine.isItPossibleToSetCellContents(adr('A1'))).toEqual(true)
  })
})

describe('changing cell content', () => {
  it('update formula vertex', () => {
    const sheet = [
      ['1', '2', '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    let c1 = engine.addressMapping.fetchCell(adr('C1'))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(1)

    engine.setCellContents(adr('C1'), [['=B1']])

    c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue(adr('C1'))).toBe(2)
  })

  it('update formula to number cell vertex', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    engine.setCellContents(adr('B1'), [['7']])
    expect(engine.getCellValue(adr('B1'))).toBe(7)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update formula to plain text cell vertex', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
    engine.setCellContents(adr('B1'), [['foo']])
    expect(engine.getCellValue(adr('B1'))).toBe('foo')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('set vertex with edge to empty cell', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1'],
    ])

    engine.setCellContents(adr('A1'), [[null]])

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const a2 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toEqual(new EmptyCellVertex())
    expect(engine.graph.existsEdge(a1, a2)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe(EmptyValue)
  })

  it('update formula to empty cell', () => {
    const sheet = [
      ['1', '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)

    engine.setCellContents(adr('B1'), [[null]])
    expect(engine.getCellValue(adr('B1'))).toBe(EmptyValue)
    expect(engine.graph.nodes).not.toContain(b1)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update value cell to formula', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    let b1 = engine.addressMapping.fetchCell(adr('B1'))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(2)
    engine.setCellContents(adr('B1'), [['=A1']])

    b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('update value cell to value cell', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    expect(engine.getCellValue(adr('B1'))).toBe(2)
    engine.setCellContents(adr('B1'), [['3']])
    expect(engine.getCellValue(adr('B1'))).toBe(3)
  })

  it('update value cell to value cell with the same value', () => {
    const sheet = [
      ['1', '2', '=SUM(A1:B1)'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const b1 = engine.addressMapping.getCell(adr('B1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b1setCellValueSpy = jest.spyOn(b1 as any, 'setCellValue')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.setCellContents(adr('B1'), [['2']])

    expect(b1setCellValueSpy).not.toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('update value cell to empty', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    expect(engine.getCellValue(adr('B1'))).toBe(2)
    engine.setCellContents(adr('B1'), null)
    expect(engine.addressMapping.getCell(adr('B1'))).toBe(null)
    expect(engine.getCellValue(adr('B1'))).toBe(EmptyValue)
  })

  it('update value cell to error literal', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.setCellContents(adr('A1'), '#DIV/0!')

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('update value cell to error-like literal', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.setCellContents(adr('A1'), '#FOO!')

    expect(engine.getCellValue(adr('A1'))).toEqual('#FOO!')
  })

  it('rewrite part of sheet with matrix', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['=A1', null],
      ['1', 'foo'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A3'), '{=MMULT(A1:B2,A1:B2)}')
    expect(engine.addressMapping.fetchCell(adr('A3'))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping.fetchCell(adr('B4'))).toBeInstanceOf(MatrixVertex)
    expect(engine.getCellValue(adr('A3'))).toBe(7)
  })

  it('changing value inside range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue(adr('B3'))).toEqual(6)

    engine.setCellContents({sheet: 0, col: 0, row: 0}, '3')
    expect(engine.getCellValue(adr('B3'))).toEqual(8)
  })

  it('changing value inside column range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '0', '=SUM(A:B)'],
    ])
    expect(engine.getCellValue(adr('C3'))).toEqual(6)

    engine.setCellContents({sheet: 0, col: 1, row: 0}, '3')
    expect(engine.getCellValue(adr('C3'))).toEqual(9)
  })

  it('changing value inside row range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['=SUM(1:2)'],
    ])
    expect(engine.getCellValue(adr('A3'))).toEqual(3)

    engine.setCellContents({sheet: 0, col: 1, row: 0}, '3')
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
  })

  it('set formula for the first time', () => {
    const sheet = [
      ['42', ''],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), null)
    const a1 = engine.addressMapping.getCell(adr('A1'))
    expect(a1).toBe(null)
    expect(engine.getCellValue(adr('A1'))).toBe(EmptyValue)
  })

  it('set number for the first time', () => {
    const sheet = [
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), '7')

    expect(engine.getCellValue(adr('A1'))).toBe(7)
  })

  it('set text for the first time', () => {
    const sheet = [
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), 'foo')

    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('change empty to formula', () => {
    const sheet = [
      ['42', null, '=B1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), '=A1')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(42)
    expect(engine.getCellValue(adr('C1'))).toBe(42)
  })

  it('set nothing again', () => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), null)

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(a1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
  })

  it('change EMPTY to NUMBER', () => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), '7')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe(7)
  })

  it('change EMPTY to TEXT', () => {
    const sheet = [
      [null, '=A1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), 'foo')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('change numeric value inside matrix to another number', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    engine.setCellContents(adr('A1'), '5')
    expect(engine.getCellValue(adr('A1'))).toBe(5)
  })

  it('ensure that only part of the tree is evaluated', () => {
    const sheet = [
      ['1', '2'],
      ['=A1', '=B1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const b2 = engine.addressMapping.getCell(adr('B2'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a2setCellValueSpy = jest.spyOn(a2 as any, 'setCellValue')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b2setCellValueSpy = jest.spyOn(b2 as any, 'setCellValue')

    engine.setCellContents(adr('A1'), '3')
    expect(a2setCellValueSpy).toHaveBeenCalled()
    expect(b2setCellValueSpy).not.toHaveBeenCalled()
  })

  it('should not be possible to edit part of a Matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      [null, '{=TRANSPOSE(A1:B1)}'],
    ])

    expect(() => {
      engine.setCellContents(adr('A2'), '{=TRANSPOSE(C1:C2)}')
    }).toThrow('You cannot modify only part of an array')
  })

  it('is not possible to set cell content in sheet which does not exist', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    expect(() => {
      engine.setCellContents(adr('B1', 1), '3')
    }).toThrow(new NoSheetWithIdError(1))
  })

  it('is not possible to set cell content with invalid address', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    const address = {row: -1, col: 0, sheet: 0}
    expect(() => {
      engine.setCellContents(address, '3')
    }).toThrow(new InvalidAddressError(address))
  })

  it('remembers if the new formula is structure dependent', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=TRUE()'],
      ['1'],
    ])

    engine.setCellContents(adr('C1'), '=COLUMNS(A1:B1)')
    const c1 = engine.addressMapping.getCell(adr('C1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')
    engine.removeRows(0, [1, 1])

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('returns cell value change', () => {
    const sheet = [
      ['1'],
    ]

    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 0, 0), 2))
  })

  it('returns dependent formula value change', () => {
    const sheet = [
      ['1', '=A1'],
    ]

    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(2)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 0, 0), 2))
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 1, 0), 2))
  })

  it('returns dependent matrix value changes', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['{=MMULT(A1:B2,A1:B2)}'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), '2')

    expect(changes.length).toBe(5)
    expect(changes.map((change) => change.newValue)).toEqual(expect.arrayContaining([2, 10, 12, 18, 22]))
  })

  it('returns change of numeric matrix', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
    ]
    const engine = HyperFormula.buildFromArray(sheet, {matrixDetection: true, matrixDetectionThreshold: 1})

    const changes = engine.setCellContents(adr('A1'), '7')

    expect(changes.length).toBe(1)
    expect(changes).toContainEqual(new ExportedCellChange(simpleCellAddress(0, 0, 0), 7 ))
  })

  it('update empty cell to parsing error ', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.setCellContents(adr('A1'), '=SUM(')

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })

  it('update dependecy value cell to parsing error ', () => {
    const sheet = [
      ['1', '=SUM(A1)'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('A1'), '=SUM(')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })

  it('update formula cell to parsing error ', () => {
    const sheet = [
      ['1', '=SUM(A1)'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), '=SUM(')

    const a1 = engine.addressMapping.fetchCell(adr('A1'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })

  it('update parsing error to formula', () => {
    const sheet = [
      ['1', '=SUM('],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), '=SUM(A1)')

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('update empty cell to unparsable matrix formula', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.setCellContents(adr('A1'), '{=TRANSPOSE(}')

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellFormula(adr('A1'))).toEqual('{=TRANSPOSE(}')
  })
})

describe('change multiple cells contents', () => {
  it('works for one', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), [['3']])
    expect(engine.getCellValue(adr('B1'))).toBe(3)
  })

  it('works for many', () => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    engine.setCellContents(adr('B1'), [
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

  it('recompute only once', () => {
    const sheet = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evaluatorCallSpy = jest.spyOn(engine.evaluator as any, 'partialRun')

    engine.setCellContents(adr('B1'), [
      ['12', '13'],
      ['15', '16'],
      ['18', '19'],
    ])

    expect(evaluatorCallSpy).toHaveBeenCalledTimes(1)
  })

  it('it not possible to change matrices', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    expect(() => {
      engine.setCellContents(adr('A1'), [['42', '{=MMULT(A1:B2,A1:B2)}']])
    }).toThrow('Cant change matrices in batch operation')
    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('returns changes of mutliple values', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), [['7', '8'], ['9', '10']])

    expect(changes.length).toEqual(4)
    expect(changes.map((change) => change.newValue)).toEqual(expect.arrayContaining([7, 8, 9, 10]))
  })

  it('returns changes of mutliple values dependent formulas', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
      ['=SUM(A1:B1)', '=SUM(B1:B2)'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)

    const changes = engine.setCellContents(adr('A1'), [['7', '8'], ['9', '10']])

    expect(changes.length).toEqual(6)
    expect(changes.map((change) => change.newValue)).toEqual(expect.arrayContaining([7, 8, 9, 10, 15, 18]))
  })
})

describe('updating column index', () => {
  it('should update column index when changing simple value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '15'],
    ], {matrixDetection: false, vlookupThreshold: 1, useColumnIndex: true})

    engine.setCellContents(adr('B2'), '8')

    expect((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 4).index).toEqual(expect.arrayContaining([]))
    expect((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 8).index).toEqual(expect.arrayContaining([1]))
  })

  it('should update column index when changing value inside numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '15'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1, vlookupThreshold: 1, useColumnIndex: true})

    engine.setCellContents(adr('B2'), '8')

    expect((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 4).index).toEqual(expect.arrayContaining([]))
    expect((engine.columnSearch as ColumnIndex).getValueIndex(0, 1, 8).index).toEqual(expect.arrayContaining([1]))
  })
})

describe('numeric matrices', () => {
  it('should not break matrix into single vertices when changing to numeric value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.setCellContents(adr('A1'), '7')

    expect(engine.graph.nodesCount()).toBe(1)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe(7)
  })

  it('should allow to change numeric matrix cell to non-numeric value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.setCellContents(adr('A1'), 'foo')

    expect(engine.graph.nodesCount()).toBe(4)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(0)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })

  it('should break only affected matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      [null],
      ['5', '6'],
      ['7', '8'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    engine.setCellContents(adr('A1'), 'foo')

    expect(engine.graph.nodesCount()).toBe(5)
    expect(Array.from(engine.matrixMapping.numericMatrices()).length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })
})

describe('column ranges', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    engine.setCellContents(adr('A1'), '3')

    expect(engine.getCellValue(adr('C1'))).toEqual(5)
  })

  it('works when new content is added beyond previous sheet size', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    engine.setCellContents(adr('A2'), '3')

    const range = engine.rangeMapping.fetchRange(colStart('A'), colEnd('B'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    expect(engine.graph.existsEdge(a2, range)).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(6)
  })

  it('works when adding matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(B:C)'],
      ['1'],
      ['2'],
    ])

    engine.setCellContents(adr('B1'), '{=TRANSPOSE(A2:A3)}')

    const range = engine.rangeMapping.fetchRange(colStart('B'), colEnd('C'))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    expect(engine.graph.existsEdge(b1, range)).toEqual(true)
    expect(engine.graph.existsEdge(c1, range)).toEqual(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })
})

describe('row ranges', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(1:2)']
    ])

    engine.setCellContents(adr('A1'), '3')

    expect(engine.getCellValue(adr('A3'))).toEqual(5)
  })

  it('works when new content is added beyond previous sheet size', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=SUM(1:2)']
    ])

    engine.setCellContents(adr('B1'), '3')

    const range = engine.rangeMapping.fetchRange(rowStart(1), rowEnd(2))
    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    expect(engine.graph.existsEdge(b1, range)).toEqual(true)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
  })

  it('works when adding matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(2:3)', '1', '2'],
    ])

    engine.setCellContents(adr('A2'), '{=TRANSPOSE(B1:C1)}')

    const range = engine.rangeMapping.fetchRange(rowStart(2), rowEnd(3))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a3 = engine.addressMapping.fetchCell(adr('A3'))
    expect(engine.graph.existsEdge(a2, range)).toEqual(true)
    expect(engine.graph.existsEdge(a3, range)).toEqual(true)
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })
})
