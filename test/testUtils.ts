import {Config, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {DateHelper} from '../src/DateHelper'
import {FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {defaultStringifyDate} from '../src/format/format'
import {
  AstNodeType,
  buildCellErrorAst,
  buildLexerConfig, CellAddress,
  cellAddressFromString,
  CellRangeAst,
  CellReferenceAst,
  ProcedureAst,
  Unparser,
} from '../src/parser'
import {EngineComparator} from './graphComparator'

export const extractReference = (engine: HyperFormula, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as CellReferenceAst).reference
}

export const extractRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const extractMatrixRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as MatrixVertex).getFormula() as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const expect_reference_to_have_ref_error = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_function_to_have_ref_error = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  expect(formula.args.find((arg) => arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expect_cell_to_have_formula = (engine: HyperFormula, addressString: string, expectedFormula: string) => {
  const address = cellAddressFromString(engine.sheetMapping.fetch, addressString, CellAddress.absolute(0, 0, 0))
  const formula = (engine.addressMapping.fetchCell(address!) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  const unparser = new Unparser(engine.config, buildLexerConfig(engine.config), engine.sheetMapping.fetchDisplayName)
  expect(unparser.unparse(formula, address!)).toEqual(expectedFormula)
}

export const expect_array_with_same_content = (expected: any[], actual: any[]) => {
  expect(actual.length).toBe(expected.length)
  expect(actual).toEqual(expect.arrayContaining(expected))
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

export const expectEngineToBeTheSameAs = (actual: HyperFormula, expected: HyperFormula) => {
  const comparator = new EngineComparator(expected, actual)
  comparator.compare()
}

export function dateNumberToString(dateNumber: CellValue, config = new Config()): string | CellError {
  if(dateNumber instanceof CellError) {
    return dateNumber
  }
  const dateHelper = new DateHelper(config)
  const dateString = defaultStringifyDate(dateNumber as number, config.dateFormats[0], dateHelper)
  return dateString ? dateString : ''
}

export function expectCloseTo(actual: CellValue, expected: number, precision: number = 0.000001) {
  if (typeof actual !== 'number') {
    expect(true).toBe(false)
  } else {
    expect(Math.abs(actual - expected)).toBeLessThan(precision)
  }
}
