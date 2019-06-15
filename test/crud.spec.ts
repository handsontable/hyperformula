import {HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {MatrixVertex, FormulaCellVertex} from "../src/Vertex";
import {CellAddress} from "../src/parser/CellAddress"
import {CellReferenceAst} from "../src/parser/Ast"

describe('changing cell content', () => {
  it('update formula vertex', () => {
    const sheet = [
        ['1', '2', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    const c1 = engine.addressMapping!.getCell(simpleCellAddress(0, 2, 0))

    expect(engine.graph.existsEdge(a1, c1)).toBe(true)
    expect(engine.getCellValue("C1")).toBe(1)

    engine.setCellContent(simpleCellAddress(0, 2, 0), "=B1")

    expect(engine.graph.existsEdge(a1, c1)).toBe(false)
    expect(engine.graph.existsEdge(b1, c1)).toBe(true)

    expect(engine.getCellValue("C1")).toBe(2)
  })

  it('update formula to number cell vertex', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
    engine.setCellContent(simpleCellAddress(0, 1, 0), "7")
    expect(engine.getCellValue("B1")).toBe(7)
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it('update formula to plain text cell vertex', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
    engine.setCellContent(simpleCellAddress(0, 1, 0), "foo")
    expect(engine.getCellValue("B1")).toBe("foo")
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
  })

  it ('update formula to empty cell', () => {
    const sheet = [
      ['1', '=A1']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)

    engine.setCellContent(simpleCellAddress(0, 1, 0), '')
    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue("B1")).toBe(0)
  })

  it ('update value cell to formula', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)
    const a1 = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0))
    let b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))

    expect(engine.graph.existsEdge(a1, b1)).toBe(false)
    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '=A1')

    b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    expect(engine.graph.existsEdge(a1, b1)).toBe(true)
    expect(engine.getCellValue("B1")).toBe(1)
  })

  it ('update value cell to value cell', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '3')
    expect(engine.getCellValue("B1")).toBe(3)
  })

  it ('update value cell to empty', () => {
    const sheet = [
      ['1', '2']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    expect(engine.getCellValue("B1")).toBe(2)
    engine.setCellContent(simpleCellAddress(0, 1, 0), '')
    expect(engine.getCellValue("B1")).toBe(0)
  })

  it ('rewrite part of sheet with matrix', () => {
    const sheet = [
      ['1', '2'],
      ['3', '4'],
      ['=A1', '=B1'],
      ['1', 'foo']
    ]
    const engine = HandsOnEngine.buildFromArray(sheet)

    engine.setCellContent(simpleCellAddress(0, 0, 2), '{=MMULT(A1:B2,A1:B2)}')
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 0, 2))).toBeInstanceOf(MatrixVertex)
    expect(engine.addressMapping!.getCell(simpleCellAddress(0, 1, 3))).toBeInstanceOf(MatrixVertex)
    expect(engine.getCellValue("A3")).toBe(7)
  })


  it('#loadSheet - changing value inside range', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue('B3')).toEqual(6)

    await engine.setCellContent({ sheet: 0, col: 0, row: 0 }, '3')
    expect(engine.getCellValue('B3')).toEqual(8)
  })
})

const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.getCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

describe("Adding row", () => {
  xit('dependency does not change if from different sheet', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A2'],
        // new row
        ['=$Sheet2.B1'],
      ],
      Sheet2: []
    })

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0,0,0))).toEqual(CellAddress.relative(1, 0, 1))
    expect(extractReference(engine, simpleCellAddress(0,0,1))).toEqual(CellAddress.relative(1, 1, 9))
  })

  it('same sheet, case Aa, absolute row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      // new row
      ['=A$1'],
    ])

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.absoluteRow(0, 0, 0))
  })

  it('same sheet, case Aa, absolute row and col', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      // new row
      ['=$A$1'],
    ])

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.absolute(0, 0, 0))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A$2'],
      // new row
      ['42'],
    ])

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteRow(0, 0, 2))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A2'],
      ['13'],
      // new row
      ['42'],
    ])

    engine.addRow(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      ['13'],
      // new row
      ['=A2'],
    ])

    engine.addRow(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 3))).toEqual(CellAddress.relative(0, 0, -2))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=A3'],
      ['13'],
      // new row
      ['42'],
    ])

    engine.addRow(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 0, 3))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42'],
      // new row
      ['=A3'],
      ['13'],
    ])

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 2))).toEqual(CellAddress.relative(0, 0, 1))
  })

  it('insert row in middle of range', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1', '=SUM(A1:A3)'],
        // new row
        ['2', ''],
        ['3', ''],
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).not.toBe(null)
    engine.addRow(0, 1, 1)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).toBe(null)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 3))).not.toBe(null)
  })

  it('insert row above range', () => {
    const engine = HandsOnEngine.buildFromArray([
      // new row
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).not.toBe(null)
    engine.addRow(0, 0, 1)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).toBe(null)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 1), simpleCellAddress(0, 0, 3))).not.toBe(null)
  })

  it('insert row below range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
      // new row
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).not.toBe(null)
    engine.addRow(0, 3, 1)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 2))).not.toBe(null)
  })

  it('insert row, formula vertex address shifted', () => {
    const engine = HandsOnEngine.buildFromArray([
      // new row
      ['=SUM(1,2)'],
    ])

    let vertex = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 0)) as FormulaCellVertex
    expect(vertex.getAddress()).toEqual(simpleCellAddress(0, 0, 0))
    engine.addRow(0, 0, 1)
    vertex = engine.addressMapping!.getCell(simpleCellAddress(0, 0, 1)) as FormulaCellVertex
    expect(vertex.getAddress()).toEqual(simpleCellAddress(0, 0, 1))
  })
})
