import {HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../src/Cell'
import {FormulaCellVertex} from '../src/DependencyGraph'
import {
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  cellAddressFromString,
  CellRangeAst,
  CellReferenceAst,
  ProcedureAst,
  Unparser,
} from '../src/parser'

export const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

export const extractRange = (engine: HandsOnEngine, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const expect_reference_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula()
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_function_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as ProcedureAst
  expect(formula.args.find((arg) => arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_cell_to_have_formula = (engine: HandsOnEngine, addressString: string, expectedFormula: string) => {
  const address = cellAddressFromString(engine.sheetMapping.fetch, addressString, CellAddress.absolute(0, 0, 0))
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula()
  const unparser = new Unparser(engine.config, engine.sheetMapping.name)
  expect(unparser.unparse(formula, address)).toEqual(expectedFormula)
}
