import {NoErrorCellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellValue, DetailedCellError, Exporter} from './CellValue'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, ParsingErrorVertex} from './DependencyGraph'
import {Maybe} from './Maybe'
import {buildLexerConfig, Unparser} from './parser'


export class Serialization {
  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly unparser: Unparser,
    public readonly config: Config,
    public readonly exporter: Exporter
  ) {
  }
  public getCellFormulaFromEngine(address: SimpleCellAddress): Maybe<string> {
    const formulaVertex = this.dependencyGraph.getCell(address)
    if (formulaVertex instanceof FormulaCellVertex) {
      const formula = formulaVertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
      return this.unparser.unparse(formula, address)
    } else if (formulaVertex instanceof MatrixVertex) {
      const formula = formulaVertex.getFormula()
      if (formula) {
        return '{' + this.unparser.unparse(formula, formulaVertex.getAddress()) + '}'
      }
    } else if (formulaVertex instanceof ParsingErrorVertex) {
      return formulaVertex.getFormula()
    }
    return undefined
  }

  public getCellSerializedFromEngine(address: SimpleCellAddress): NoErrorCellValue {
    const formula: Maybe<string> = this.getCellFormulaFromEngine(address)
    if( formula !== undefined ) {
      return formula
    } else {
      const value: CellValue = this.getCellValueFromEngine(address)
      if(value instanceof DetailedCellError) {
        return this.config.getErrorTranslationFor(value.error.type)
      } else {
        return value
      }
    }
  }

  public getCellValueFromEngine(address: SimpleCellAddress): CellValue {
    return this.exporter.exportValue(this.dependencyGraph.getCellValue(address))
  }

  public genericSheetGetter<T>(sheet: number, getter: (address: SimpleCellAddress) => T): T[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

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

  public genericAllSheetsGetter<T>(sheetGetter: (sheet: number) => T): Record<string, T> {
    const result: Record<string, T> = {}
    for (const sheetName of this.dependencyGraph.sheetMapping.displayNames()) {
      const sheetId = this.dependencyGraph.sheetMapping.fetch(sheetName)
      result[sheetName] =  sheetGetter(sheetId)
    }
    return result
  }

  public getSheetSerializedFromEngine(sheet: number): NoErrorCellValue[][] {
    return this.genericSheetGetter(sheet, (arg) => this.getCellSerializedFromEngine(arg))
  }

  public getAllSheetsSerializedFromEngine(): Record<string, NoErrorCellValue[][]> {
    return this.genericAllSheetsGetter((arg) => this.getSheetSerializedFromEngine(arg))
  }

  public withNewConfig(newConfig: Config): Serialization {
    const newUnparser = new Unparser(newConfig, buildLexerConfig(newConfig), this.dependencyGraph.sheetMapping.fetchDisplayName)
    return new Serialization(this.dependencyGraph, newUnparser, newConfig, this.exporter)
  }
}







