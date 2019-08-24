import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress, SimpleCellAddress, CellError, ErrorType} from '../src/Cell'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {CellReferenceAst} from '../src/parser/Ast'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'
import {extractRange, adr, extractReference, extractMatrixRange} from "./testUtils";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange"

describe('Adding column - matrix check', () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error('It is not possible to add column in column with matrix'))

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error('It is not possible to add column in column with matrix'))
  })
})

describe('Adding column - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '2', '=COUNTBLANK(A1:B1)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(0)
    engine.addColumns(0, 1, 1)
    expect(engine.getCellValue('D1')).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '2', '=COUNTBLANK(A1:B1)'],
      ['=SUM(A1:A1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const a2 = engine.addressMapping.getCell(adr('A2'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')
    const a2setCellValueSpy = jest.spyOn(a2 as any, 'setCellValue')

    engine.addColumns(0, 1, 1)

    expect(a2setCellValueSpy).not.toHaveBeenCalled()
    expect(c1setCellValueSpy).toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.addColumns(0, 1, 1)

    expect(c1setCellValueSpy).toHaveBeenCalled()
    expect(extractRange(engine, adr('D1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C1')))
  })
})

describe('Adding column - FormulaCellVertex#address update', () => {
  it('updates addresses in formulas', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=A1'],
    ])

    engine.addColumns(0, 1, 1)

    const c1 = engine.addressMapping.getCell(adr('C1')) as FormulaCellVertex
    expect(c1).toBeInstanceOf(FormulaCellVertex)
    expect(c1.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('C1'))
  })
})

describe('Adding column', () => {
  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['3', '4', '{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractMatrixRange(engine, adr('D1'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C2')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['3', '4', '{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addColumns(0, 1, 1)

    const matrixVertex = engine.addressMapping.fetchCell(adr('D1')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('D1'))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4']
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
      ]
    })

    engine.addColumns(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('C2')))
  })
})

describe('Adding column', () => {
  it('add column inside numeric matrix, expand matrix', () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('B1')).toEqual(2)

    engine.addColumns(0, 1, 2)

    expect(engine.getCellValue('B1')).toEqual(0)
    expect(engine.getCellValue('C1')).toEqual(0)
    expect(engine.getCellValue('D1')).toEqual(2)
  })
})

describe('Adding column - address mapping', () => {
  it('verify sheet dimensions', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=A1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 3,
      height: 1,
    })
  })
})

describe('Adding column, fixing dependency', () => {
  it('same sheet, case Aa, absolute column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absoluteCol(0, 0, 0))
  })

  it('same sheet, case Aa, absolute row and col', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A$1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.absolute(0, 0, 0))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$B1' /* new col */, '42'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteCol(0, 2, 0))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '13', /* new col */ '42'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '13', /* new col */ '=B1'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, adr('D1'))).toEqual(CellAddress.relative(0, -2, 0))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=C1', '13', /* new col */ '42'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 3, 0))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', /* new col */ '=C1', '13'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, adr('C1'))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, same column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '43'],
      ['', '=B1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, adr('C2'))).toEqual(CellAddress.relative(0, 0, -1))
  })
})

describe('Adding column, fixing ranges', () => {
  it('insert column to empty range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['', /* new col */ '', ''],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).not.toBe(null)

    engine.addColumns(0, 1, 1)

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).toBe(null)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('D1'))).not.toBe(null)
  })

  it('insert column in middle of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '2', '3'],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).not.toBe(null)

    engine.addColumns(0, 1, 1)

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).toBe(null)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('D1'))).not.toBe(null)
  })

  it('insert column above range', () => {
    const engine = HandsOnEngine.buildFromArray([
      [/* new col */ '1', '2', '3'],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).not.toBe(null)
    engine.addColumns(0, 0, 1)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).toBe(null)
    expect(engine.rangeMapping.getRange(adr('B1'), adr('D1'))).not.toBe(null)
  })

  it('insert column below range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3' /* new col */],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).not.toBe(null)
    engine.addColumns(0, 3, 1)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('C1'))).not.toBe(null)
  })

  it('it should insert new cell with edge to only one range at right', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', /* */ '3', '4'],
      ['=SUM(A1:A1)', '=SUM(A1:B1)', /* */ '=SUM(A1:C1)', '=SUM(A1:D1)'],
    ])

    engine.addColumns(0, 2, 1)

    const c1 = engine.addressMapping.fetchCell(adr('C1'))
    const a1d1 = engine.rangeMapping.fetchRange(adr('A1'), adr('D1'))
    const a1e1 = engine.rangeMapping.fetchRange(adr('A1'), adr('E1'))

    expect(engine.graph.existsEdge(c1, a1d1)).toBe(true)
    expect(engine.graph.existsEdge(c1, a1e1)).toBe(true)
    expect(engine.graph.adjacentNodesCount(c1)).toBe(2)
  })

  it ('range start in column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(B1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.getCell(adr('B1'))
    expect(b1).toBe(null)
  })

  it('range start before added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.fetchCell(adr('B1'))
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('E1'))
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range start after added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(C1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.getCell(adr('B1'))
    expect(b1).toBe(null)
  })

  it ('range end before added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:A1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.getCell(adr('B1'))
    expect(b1).toBe(null)
  })

  it ('range end in a added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:B1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('C1'))
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range end after added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:C1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.fetchCell(adr('B1'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('D1'))
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range start and end in an added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(B1:B1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping.getCell(adr('B1'))
    expect(b1).toBe(null)
  })
})
