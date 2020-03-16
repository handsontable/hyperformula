import {NoErrorCellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellValue, DetailedCellError} from './CellValue'
import {FormulaCellVertex, MatrixVertex, ParsingErrorVertex} from './DependencyGraph'
import {HyperFormula} from './HyperFormula'
import {TranslationPackage} from './i18n'
import {Maybe} from './Maybe'
import {buildLexerConfig, Unparser} from './parser'

export function getCellFormulaFromEngine(engine: HyperFormula, address: SimpleCellAddress, customUnparser: Unparser): Maybe<string> {
  const formulaVertex = engine.dependencyGraph.getCell(address)
  if (formulaVertex instanceof FormulaCellVertex) {
    const formula = formulaVertex.getFormula(engine.dependencyGraph.lazilyTransformingAstService)
    return customUnparser.unparse(formula, address)
  } else if (formulaVertex instanceof MatrixVertex) {
    const formula = formulaVertex.getFormula()
    if (formula) {
      return '{' + customUnparser.unparse(formula, formulaVertex.getAddress()) + '}'
    }
  } else if (formulaVertex instanceof ParsingErrorVertex) {
    return formulaVertex.getFormula()
  }
  return undefined
}

export function getCellSerializedFromEngine(engine: HyperFormula, address: SimpleCellAddress, customUnparser: Unparser): NoErrorCellValue {
  const formula: Maybe<string> = getCellFormulaFromEngine(engine, address, customUnparser)
  if( formula !== undefined ) {
    return formula
  } else {
    const value: CellValue = engine.getCellValue(address)
    if(value instanceof DetailedCellError) {
      return engine.config.getErrorTranslationFor(value.error.type)
    } else {
      return value
    }
  }
}

export function genericSheetGetter<T>(engine: HyperFormula, sheet: number, getter: (address: SimpleCellAddress) => T): T[][] {
  const sheetHeight = engine.dependencyGraph.getSheetHeight(sheet)
  const sheetWidth = engine.dependencyGraph.getSheetWidth(sheet)

  const arr: T[][] = new Array(sheetHeight)
  for (let i = 0; i < sheetHeight; i++) {
    arr[i] = new Array(sheetWidth)

    for (let j = 0; j < sheetWidth; j++) {
      const address = simpleCellAddress(sheet, j, i)
      arr[i][j] = getter(address)
    }
  }
  return arr
}

export function genericAllSheetsGetter<T>(engine: HyperFormula, sheetGetter: (sheet: number) => T): Record<string, T> {
  const result: Record<string, T> = {}
  for (const sheetName of engine.sheetMapping.displayNames()) {
    const sheetId = engine.sheetMapping.fetch(sheetName)
    result[sheetName] =  sheetGetter(sheetId)
  }
  return result
}

export function getSheetSerializedFromEngine(engine: HyperFormula, sheet: number, customUnparser: Unparser): NoErrorCellValue[][] {
  return genericSheetGetter(engine, sheet, (arg) => getCellSerializedFromEngine(engine, arg, customUnparser))
}

export function getAllSheetsSerializedFromEngine(engine: HyperFormula, customUnparser: Unparser): Record<string, NoErrorCellValue[][]> {
  return genericAllSheetsGetter(engine, (arg) => getSheetSerializedFromEngine(engine, arg, customUnparser))
}

export function getAllSheetsSerializedWithLanguageFromEngine(engine: HyperFormula, language: TranslationPackage): Record<string, NoErrorCellValue[][]> {
  const configNewLanguage = engine.config.mergeConfig( {language} )
  const actualUnparser = new Unparser(configNewLanguage, buildLexerConfig(configNewLanguage), engine.dependencyGraph.sheetMapping.fetchDisplayName)
  return getAllSheetsSerializedFromEngine(engine, actualUnparser)
}

