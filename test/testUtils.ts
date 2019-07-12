import {HandsOnEngine} from "../src";
import {CellError, ErrorType, SimpleCellAddress} from "../src/Cell";
import {AstNodeType, buildCellErrorAst, CellAddress, CellReferenceAst, ProcedureAst} from "../src/parser";
import {FormulaCellVertex} from "../src/DependencyGraph";

export const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

export const expect_reference_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula()
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_function_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as ProcedureAst
  expect(formula.args.find(arg => arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}
