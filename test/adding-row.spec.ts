import {HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {FormulaCellVertex} from "../src/Vertex";
import {CellAddress} from "../src/parser/CellAddress"
import {CellReferenceAst} from "../src/parser/Ast"


const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.getCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
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
