import {Config, HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {EmptyCellVertex, FormulaCellVertex, RangeVertex} from "../src/DependencyGraph";
import {CellAddress} from "../src/parser/CellAddress"
import {CellReferenceAst} from "../src/parser/Ast"


const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

describe("Adding column", () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13']
    ])

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error("It is not possible to add column in column with matrix"))

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error("It is not possible to add column in column with matrix"))
  })
})

describe("Adding column, fixing dependency", () => {
  it('same sheet, case Aa, absolute column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absoluteCol(0, 0, 0))
  })

  it('same sheet, case Aa, absolute row and col', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A$1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absolute(0, 0, 0))
  })
})
