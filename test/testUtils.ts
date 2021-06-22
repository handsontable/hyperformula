import {CellValue, DetailedCellError, HyperFormula} from '../src'
import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../src/AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress, simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {DateTimeHelper} from '../src/DateTimeHelper'
import {FormulaCellVertex, MatrixVertex, RangeVertex} from '../src/DependencyGraph'
import {defaultStringifyDateTime} from '../src/format/format'
import {complex} from '../src/interpreter/ArithmeticHelper'
import {
  AstNodeType,
  CellAddress,
  CellRangeAst,
  CellReferenceAst,
  ErrorAst,
  ProcedureAst,
  simpleCellAddressToString,
} from '../src/parser'
import {ColumnRangeAst, RowRangeAst} from '../src/parser/Ast'
import {EngineComparator} from './graphComparator'

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
  return AbsoluteRowRange.fromRowRangeAst(rangeAst, address)
}

export const extractMatrixRange = (engine: HyperFormula, address: SimpleCellAddress): AbsoluteCellRange => {
  const formula = (engine.addressMapping.fetchCell(address) as MatrixVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const rangeAst = formula.args[0] as CellRangeAst
  return AbsoluteCellRange.fromCellRange(rangeAst, address)
}

export const expectReferenceToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const errorAst = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ErrorAst
  expect(errorAst.type).toEqual(AstNodeType.ERROR)
  expect(errorAst.error).toEqualError(new CellError(ErrorType.REF))
}

export const expectFunctionToHaveRefError = (engine: HyperFormula, address: SimpleCellAddress) => {
  const formula = (engine.addressMapping.fetchCell(address) as FormulaCellVertex).getFormula(engine.lazilyTransformingAstService) as ProcedureAst
  const errorAst = formula.args.find((arg) => arg !== undefined && arg.type === AstNodeType.ERROR) as ErrorAst
  expect(errorAst.type).toEqual(AstNodeType.ERROR)
  expect(errorAst.error).toEqualError(new CellError(ErrorType.REF))
}

export const rangeAddr = (range: AbsoluteCellRange) => {
  const start = simpleCellAddressToString(() => '', range.start, 0)
  const end = simpleCellAddressToString(() => '', range.end, 0)
  return `${start}:${end}`
}

export const verifyRangesInSheet = (engine: HyperFormula, sheet: number, ranges: string[]) => {
  const rangeVerticesInMapping = Array.from(engine.rangeMapping.rangesInSheet(sheet))
    .map((vertex) => rangeAddr(vertex.range))

  const rangeVerticesInGraph = Array.from(engine.graph.nodes.values()).filter(vertex => vertex instanceof RangeVertex)
    .map(vertex => rangeAddr((vertex as RangeVertex).range))

  expectNoDuplicates(rangeVerticesInGraph)
  expectNoDuplicates(rangeVerticesInMapping)
  expectArrayWithSameContent(rangeVerticesInGraph, ranges)
  expectArrayWithSameContent(rangeVerticesInMapping, ranges)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expectNoDuplicates = (array: any[]) => {
  expect(new Set(array).size === array.length).toBe(true)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expectArrayWithSameContent = (expected: any[], actual: any[]) => {
  expect(actual.length).toBe(expected.length)
  for (const iter of expected) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(actual).toContainEqual(iter)
  }
}

export const expectToBeCloseForComplex = (engine: HyperFormula, cell: string, expected: string, precision?: number) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const coerce = (arg: CellValue): complex => engine.evaluator.interpreter.arithmeticHelper.coerceScalarToComplex(arg)
  const actualVal: complex = coerce(engine.getCellValue(adr(cell)))
  const expectedVal: complex = coerce(expected)
  expect(expectedVal[0]).toBeCloseTo(actualVal[0], precision)
  expect(expectedVal[1]).toBeCloseTo(actualVal[1], precision)
}

export const verifyValues = (engine: HyperFormula) => {
  const serialization = engine.getAllSheetsSerialized()
  const engine2 = HyperFormula.buildFromSheets(serialization)
  expect(engine.getAllSheetsValues()).toEqual(engine2.getAllSheetsValues())
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

export function detailedErrorWithOrigin(errorType: ErrorType, address: string, message?: string, config?: Config): DetailedCellError {
  config = new Config(config)
  const error = new CellError(errorType, message)
  return new DetailedCellError(error, config.translationPackage.getErrorTranslation(errorType), address)
}

export const expectEngineToBeTheSameAs = (actual: HyperFormula, expected: HyperFormula) => {
  const comparator = new EngineComparator(expected, actual)
  comparator.compare()
}

export function dateNumberToString(dateNumber: CellValue, config: Config): string | DetailedCellError {
  if (dateNumber instanceof DetailedCellError) {
    return dateNumber
  }
  const dateTimeHelper = new DateTimeHelper(config)
  const dateString = defaultStringifyDateTime(dateTimeHelper.numberToSimpleDateTime(dateNumber as number), config.dateFormats[0])
  return dateString ?? ''
}

export function timeNumberToString(timeNumber: CellValue, config: Config): string | DetailedCellError {
  if (timeNumber instanceof DetailedCellError) {
    return timeNumber
  }
  const dateTimeHelper = new DateTimeHelper(config)
  const timeString = defaultStringifyDateTime(dateTimeHelper.numberToSimpleDateTime(timeNumber as number), 'hh:mm:ss.sss')
  return timeString ?? ''
}

export function unregisterAllLanguages() {
  for (const langCode of HyperFormula.getRegisteredLanguagesCodes()) {
    HyperFormula.unregisterLanguage(langCode)
  }
}
