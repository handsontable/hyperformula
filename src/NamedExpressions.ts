/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {Maybe} from './Maybe'

class NamedExpression {
  constructor(
    public readonly name: string,
    public readonly row: number,
  ) {
  }
}

class NamedExpressionsStore {
  private readonly mapping = new Map<string, NamedExpression>()
  private readonly rowMapping = new Map<number, NamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    return !(this.mapping.has(this.normalizeExpressionName(expressionName)))
  }

  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.name), namedExpression)
    this.rowMapping.set(namedExpression.row, namedExpression)
  }

  public get(expressionName: string): Maybe<NamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public getByRow(row: number): Maybe<NamedExpression> {
    return this.rowMapping.get(row)
  }

  public remove(expressionName: string): void {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    if (namedExpression) {
      this.mapping.delete(normalizedExpressionName)
      this.rowMapping.delete(namedExpression.row)
    }
  }

  public getAllNamedExpressions(): NamedExpression[] {
    return Array.from(this.mapping.values())
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }
}

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  private workbookStore = new NamedExpressionsStore()

  constructor(
  ) {
  }

  public doesNamedExpressionExist(expressionName: string): boolean {
    return this.workbookStore.has(expressionName)
  }

  public isNameAvailable(expressionName: string): boolean {
    return this.workbookStore.isNameAvailable(expressionName)
  }

  public fetchNameForNamedExpressionRow(row: number): string {
    const namedExpression = this.workbookStore.getByRow(row)
    if (!namedExpression) {
      throw new Error('Requested Named Expression does not exist')
    }
    return namedExpression.name
  }

  public getDisplayNameByName(expressionName: string): Maybe<string> {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression) {
      return namedExpression.name
    } else {
      return undefined
    }
  }

  public isNameValid(expressionName: string): boolean {
    if (/^[A-Za-z]+[0-9]+$/.test(expressionName)) {
      return false
    }
    return /^[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF\._]*$/.test(expressionName)
  }

  public addNamedExpression(expressionName: string): NamedExpression {
    if (!this.isNameValid(expressionName)) {
      throw new Error('Name of Named Expression is invalid')
    }
    if (!this.isNameAvailable(expressionName)) {
      throw new Error('Name of Named Expression already taken')
    }
    const namedExpression = new NamedExpression(expressionName, this.nextNamedExpressionRow)
    this.nextNamedExpressionRow++
    this.workbookStore.add(namedExpression)
    return namedExpression
  }

  public getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress | null {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      return null
    } else {
      return this.buildAddress(namedExpression.row)
    }
  }

  public remove(expressionName: string): void {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      throw "Named expression does not exist"
    }
    this.workbookStore.remove(expressionName)
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.workbookStore.getAllNamedExpressions().map((ne) => ne.name)
  }

  private buildAddress(namedExpressionRow: number) {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, namedExpressionRow)
  }
}
