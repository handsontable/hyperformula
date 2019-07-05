import {Config, HandsOnEngine} from "../src";
import {simpleCellAddress, SimpleCellAddress} from "../src/Cell";
import './testConfig.ts'
import {EmptyCellVertex, FormulaCellVertex, RangeVertex} from "../src/DependencyGraph";
import {CellAddress} from "../src/parser/CellAddress"
import {CellReferenceAst} from "../src/parser/Ast"


const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

describe("Adding row", () => {
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
