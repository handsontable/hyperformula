import {HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {
  AstNodeType,
  buildCellErrorAst,
  CellAddress, cellAddressFromString,
  CellRangeAst,
  CellReferenceAst,
  ProcedureAst,
  Unparser,
} from '../src/parser'
import {EngineComparator} from './graphComparator'

export const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as CellReferenceAst).reference
}

export const extractRange = (engine: HandsOnEngine, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const extractMatrixRange = (engine: HandsOnEngine, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as MatrixVertex).getFormula() as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const expect_reference_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_function_to_have_ref_error = (engine: HandsOnEngine, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  expect(formula.args.find((arg) => arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_cell_to_have_formula = (engine: HandsOnEngine, addressString: string, expectedFormula: string) => {
  const address = cellAddressFromString(engine.sheetMapping.fetch, addressString, CellAddress.absolute(0, 0, 0))
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  const unparser = new Unparser(engine.config, engine.sheetMapping.name)
  expect(unparser.unparse(formula, address)).toEqual(expectedFormula)
}

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {
  const result = stringAddress.match(/^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/)!

  let col
  if (result[4].length === 1) {
    col = result[4].toUpperCase().charCodeAt(0) - 65
  } else {
    col = result[4].split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }

  const row = Number(result[6] as string) - 1

  return simpleCellAddress(sheet, col, row)
}

export const expectEngineToBeTheSameAs = (actual: HandsOnEngine, expected: HandsOnEngine) => {
  const sheetId = 0
  const comparator = new EngineComparator(expected, actual)
  comparator.compare(sheetId)
}
