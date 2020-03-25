import {CellValue, DetailedCellError, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType, InternalCellValue, SimpleCellAddress, simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {DateHelper} from '../src/DateTime'
import {FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {defaultStringifyDate} from '../src/format/format'
import {
  AstNodeType,
  buildCellErrorAst,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ProcedureAst,
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
  return AbsoluteCellRange.fromCellRange(rangeAst, address)
}

export const expectReferenceToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService)
  expect(formula).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

export const expectFunctionToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  expect(formula.args.find((arg) => arg.type === AstNodeType.ERROR)).toEqual(buildCellErrorAst(new CellError(ErrorType.REF)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expectArrayWithSameContent = (expected: any[], actual: any[]) => {
  expect(actual.length).toBe(expected.length)
  expect(actual).toEqual(expect.arrayContaining(expected))
}

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!

  let col
  if (result[4].length === 1) {
    col = result[4].toUpperCase().charCodeAt(0) - 65
  } else {
    col = result[4].split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }

  const row = Number(result[6]) - 1

  return simpleCellAddress(sheet, col, row)
}

export function detailedError(errorType: ErrorType, message?: string, config?: Config): DetailedCellError {
  config = new Config(config)
  const error = new CellError(errorType, message)
  return new DetailedCellError(error, config.getErrorTranslationFor(errorType))
}

export const expectEngineToBeTheSameAs = (actual: HyperFormula, expected: HyperFormula) => {
  const comparator = new EngineComparator(expected, actual)
  comparator.compare()
}

export function dateNumberToString(dateNumber: CellValue, config: Config): string | DetailedCellError {
  if(dateNumber instanceof DetailedCellError) {
    return dateNumber
  }
  const dateHelper = new DateHelper(config)
  const dateString = defaultStringifyDate(dateHelper.numberToDate(dateNumber as number), config.dateFormats[0])
  return dateString ? dateString : ''
}

export function expectCloseTo(actual: InternalCellValue, expected: number, precision: number = 0.000001) {
  if (typeof actual !== 'number') {
    expect(true).toBe(false)
  } else {
    expect(Math.abs(actual - expected)).toBeLessThan(precision)
  }
}
