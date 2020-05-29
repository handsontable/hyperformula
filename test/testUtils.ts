import {CellValue, DetailedCellError, HyperFormula} from '../src'
import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress, simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {DateTimeHelper} from '../src/DateTimeHelper'
import {FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {defaultStringifyDateTime} from '../src/format/format'
import {
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ProcedureAst,
} from '../src/parser'
import {EngineComparator} from './graphComparator'
import {ColumnRangeAst, RowRangeAst} from '../src/parser/Ast'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'

export const extractReference = (engine: HyperFormula, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as CellReferenceAst).reference
}

export const extractRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return new AbsoluteCellRange(rangeAst.start.toSimpleCellAddress(address), rangeAst.end.toSimpleCellAddress(address))
}

export const extractColumnRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteColumnRange => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as ColumnRangeAst
  return AbsoluteColumnRange.fromColumnRange(rangeAst, address)
}

export const extractRowRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteRowRange => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as RowRangeAst
  return AbsoluteRowRange.fromRowRange(rangeAst, address)
}

export const extractMatrixRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as MatrixVertex).getFormula() as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return AbsoluteCellRange.fromCellRange(rangeAst, address)
}

export const expectReferenceToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expectFunctionToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  expect(formula.args.find((arg) => arg!==undefined && arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expectArrayWithSameContent = (expected: any[], actual: any[]) => {
  expect(actual.length).toBe(expected.length)
  for(const iter of expected) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(actual).toContainEqual(iter)
  }
}

export const rowStart = (input: number, sheet: number = 0): SimpleCellAddress => {
  return simpleCellAddress(sheet, 0, input - 1)
}

export const rowEnd = (input: number, sheet: number = 0): SimpleCellAddress => {
  return simpleCellAddress(sheet, Number.POSITIVE_INFINITY, input - 1)
}

export const colStart = (input: string, sheet: number = 0): SimpleCellAddress => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const result = /^(\$?)([A-Za-z]+)/.exec(input)!
  return simpleCellAddress(sheet, colNumber(result[2]), 0)
}

export const colEnd = (input: string, sheet: number = 0): SimpleCellAddress => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const result = /^(\$?)([A-Za-z]+)/.exec(input)!
  return simpleCellAddress(sheet, colNumber(result[2]), Number.POSITIVE_INFINITY)
}

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!
  const row = Number(result[6]) - 1
  return simpleCellAddress(sheet, colNumber(result[4]), row)
}

const colNumber = (input: string): number => {
  if (input.length === 1) {
    return input.toUpperCase().charCodeAt(0) - 65
  } else {
    return input.split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }
}

export function detailedError(errorType: ErrorType, message?: string, config?: Config): DetailedCellError {
  config = new Config(config)
  const error = new CellError(errorType, message)
  return new DetailedCellError(error, config.translationPackage.getErrorTranslation(errorType))
}

export const expectEngineToBeTheSameAs = (actual: HyperFormula, expected: HyperFormula) => {
  const comparator = new EngineComparator(expected, actual)
  comparator.compare()
}

export function dateNumberToString(dateNumber: CellValue, config: Config): string | DetailedCellError {
  if(dateNumber instanceof DetailedCellError) {
    return dateNumber
  }
  const dateHelper = new DateTimeHelper(config)
  const dateString = defaultStringifyDateTime(dateHelper.numberToDateTime(dateNumber as number), config.dateFormats[0])
  return dateString ? dateString : ''
}

export function expectCloseTo(actual: InternalScalarValue, expected: number, precision: number = 0.000001) {
  if (typeof actual !== 'number') {
    expect(true).toBe(false)
  } else {
    expect(Math.abs(actual - expected)).toBeLessThan(precision)
  }
}

export function unregisterAllLanguages() {
  for (const langCode of HyperFormula.getRegisteredLanguagesCodes()) {
    HyperFormula.unregisterLanguage(langCode)
  }
}

export function unregisterAllFormulas() {
  for (const formulaId of FunctionRegistry.getRegisteredFunctionIds()) {
    HyperFormula.unregisterFunction(formulaId)
  }
}
