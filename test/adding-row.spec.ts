import {Config, HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {FormulaCellVertex, RangeVertex} from "../src/Vertex";
import {CellAddress} from "../src/parser/CellAddress"
import {CellReferenceAst} from "../src/parser/Ast"


const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

describe("Adding row", () => {
  it('local dependency does not change if we add rows in other sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['42'],
        // new row
        ['13'],
      ],
      Sheet2: [
        ['=A2'],
        ['=B1']
      ]
    })

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(1,0,0))).toEqual(CellAddress.relative(1, 0, 1))
    expect(extractReference(engine, simpleCellAddress(1,0,1))).toEqual(CellAddress.relative(1, 1, -1))
  })

  it('absolute dependency does not change if dependency is in other sheet than we add rows', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['=$Sheet2.A$2'],
        // new row
        ['13'],
      ],
      Sheet2: [
        ['42'],
        ['78']
      ]
    })

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteRow(1, 0, 1))
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

  it('same sheet, same row', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['42'],
        ['43', '=A2']
    ])

    engine.addRow(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 1, 2))).toEqual(CellAddress.relative(0, -1, 0))
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

    let vertex = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0)) as FormulaCellVertex
    expect(vertex.getAddress()).toEqual(simpleCellAddress(0, 0, 0))
    engine.addRow(0, 0, 1)
    vertex = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1)) as FormulaCellVertex
    expect(vertex.getAddress()).toEqual(simpleCellAddress(0, 0, 1))
  })

  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13']
    ])

    expect(() => {
      engine.addRow(0, 3, 1)
    }).toThrow(new Error("It is not possible to add row in row with matrix"))

    expect(() => {
      engine.addRow(0, 2, 1)
    }).toThrow(new Error("It is not possible to add row in row with matrix"))
  })

  it('add row inside numeric matrix, expand matrix', () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
        ['1','2'],
        ['3','4'],
    ], config)

    expect(engine.getCellValue("A2")).toEqual(3)

    engine.addRow(0, 1, 2)

    expect(engine.getCellValue("A2")).toEqual(0)
    expect(engine.getCellValue("A3")).toEqual(0)
    expect(engine.getCellValue("A4")).toEqual(3)
  })

  it('it should insert new cell with edge to only one range below', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1','=SUM(A1:A1)'],
      ['2','=SUM(A1:A2)'],
      //
      ['3','=SUM(A1:A3)'],
      ['4','=SUM(A1:A4)'],
    ])

    engine.addRow(0, 2, 1)

    const a3 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 2))
    const a1a4 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 3))! // A1:A4

    expect(engine.graph.existsEdge(a3, a1a4)).toBe(true)
    expect(engine.graph.adjacentNodesCount(a3)).toBe(1)
  })
})
