/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {RawCellContent} from './CellContentParser'
import {CellValue, DetailedCellError, NoErrorCellValue} from './CellValue'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, ParsingErrorVertex} from './DependencyGraph'
import {Exporter} from './Exporter'
import {RawScalarValue} from './interpreter/InterpreterValue'
import {Maybe} from './Maybe'
import {buildLexerConfig, Unparser} from './parser'
import {NamedExpressionOptions, NamedExpressions} from './NamedExpressions'

export interface SerializedNamedExpression {
  name: string,
  expression: RawCellContent,
  scope?: number,
  options: Maybe<NamedExpressionOptions>,
}

export class Serialization {
  constructor(
    public readonly dependencyGraph: DependencyGraph,
    public readonly unparser: Unparser,
    public readonly config: Config,
    public readonly exporter: Exporter
  ) {
  }

  public getCellFormula(address: SimpleCellAddress): Maybe<string> {
    const formulaVertex = this.dependencyGraph.getCell(address)
    if (formulaVertex instanceof FormulaCellVertex) {
      const formula = formulaVertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
      return this.unparser.unparse(formula, address)
    } else if (formulaVertex instanceof MatrixVertex) {
      if(formulaVertex.getAddress().row !== address.row || formulaVertex.getAddress().col !== address.col || formulaVertex.getAddress().sheet !== address.sheet) {
        return undefined
      }
      const formula = formulaVertex.getFormula()
      if (formula !== undefined) {
        return this.unparser.unparse(formula, formulaVertex.getAddress())
      }
    } else if (formulaVertex instanceof ParsingErrorVertex) {
      return formulaVertex.getFormula()
    }
    return undefined
  }

  public getCellSerialized(address: SimpleCellAddress): RawCellContent {
    const formula: Maybe<string> = this.getCellFormula(address)
    if (formula !== undefined) {
      return formula
    } else {
      return this.getRawValue(address)
    }
  }

  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.exporter.exportValue(this.dependencyGraph.getScalarValue(address))
  }

  public getRawValue(address: SimpleCellAddress): RawCellContent {
    return this.dependencyGraph.getRawValue(address)
  }

  public getSheetValues(sheet: number): CellValue[][] {
    return this.genericSheetGetter(sheet, (arg) => this.getCellValue(arg))
  }

  public getSheetFormulas(sheet: number): Maybe<string>[][] {
    return this.genericSheetGetter(sheet, (arg) => this.getCellFormula(arg))
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
      for (let j = sheetWidth - 1; j >= 0; j--) {
        if (arr[i][j] === null || arr[i][j] === undefined) {
          arr[i].pop()
        } else {
          break
        }
      }
    }

    for (let i = sheetHeight - 1; i >= 0; i--) {
      if (arr[i].length === 0) {
        arr.pop()
      } else {
        break
      }
    }
    return arr
  }

  public genericAllSheetsGetter<T>(sheetGetter: (sheet: number) => T): Record<string, T> {
    const result: Record<string, T> = {}
    for (const sheetName of this.dependencyGraph.sheetMapping.displayNames()) {
      const sheetId = this.dependencyGraph.sheetMapping.fetch(sheetName)
      result[sheetName] = sheetGetter(sheetId)
    }
    return result
  }

  public getSheetSerialized(sheet: number): RawCellContent[][] {
    return this.genericSheetGetter(sheet, (arg) => this.getCellSerialized(arg))
  }

  public getAllSheetsValues(): Record<string, CellValue[][]> {
    return this.genericAllSheetsGetter((arg) => this.getSheetValues(arg))
  }

  public getAllSheetsFormulas(): Record<string, Maybe<string>[][]> {
    return this.genericAllSheetsGetter((arg) => this.getSheetFormulas(arg))
  }

  public getAllSheetsSerialized(): Record<string, RawCellContent[][]> {
    return this.genericAllSheetsGetter((arg) => this.getSheetSerialized(arg))
  }

  public getAllNamedExpressionsSerialized(): SerializedNamedExpression[] {
    return this.dependencyGraph.namedExpressions.getAllNamedExpressions().map((entry) => {
      return {
        name: entry.expression.displayName,
        expression: this.getCellSerialized(entry.expression.address),
        scope: entry.scope,
        options: entry.expression.options
      }
    })
  }

  public withNewConfig(newConfig: Config, namedExpressions: NamedExpressions): Serialization {
    const newUnparser = new Unparser(newConfig, buildLexerConfig(newConfig), this.dependencyGraph.sheetMapping.fetchDisplayName, namedExpressions)
    return new Serialization(this.dependencyGraph, newUnparser, newConfig, this.exporter)
  }
}
