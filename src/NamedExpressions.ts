/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {Maybe} from './Maybe'

export class NamedExpression {
  constructor(
    public displayName: string,
    public readonly address: SimpleCellAddress,
    public added: boolean,
  ) {
  }
}

class WorkbookStore {
  private readonly mapping = new Map<string, NamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    return !(namedExpression && namedExpression.added)
  }

  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.displayName), namedExpression)
  }

  public get(expressionName: string): Maybe<NamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public getExisting(expressionName: string): Maybe<NamedExpression> {
    const namedExpression = this.mapping.get(this.normalizeExpressionName(expressionName))
    if (namedExpression && namedExpression.added) {
      return namedExpression
    } else {
      return undefined
    }
  }

  public remove(expressionName: string): void {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    if (namedExpression) {
      namedExpression.added = false
    }
  }

  public getAllNamedExpressions(): NamedExpression[] {
    return Array.from(this.mapping.values()).filter((ne: NamedExpression) => ne.added)
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }
}

class WorksheetStore {
  public readonly mapping = new Map<string, NamedExpression>()

  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.displayName), namedExpression)
  }

  public get(expressionName: string): Maybe<NamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }

  public isNameAvailable(expressionName: string): boolean {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    return !this.mapping.has(normalizedExpressionName)
  }

  public remove(expressionName: string): void {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    if (namedExpression) {
      this.mapping.delete(normalizedExpressionName)
    }
  }
}

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  public readonly workbookStore: WorkbookStore = new WorkbookStore()
  public readonly worksheetStores: Map<number, WorksheetStore> = new Map()
  public readonly addressCache: Map<number, NamedExpression> = new Map()

  constructor(
  ) {
  }

  public isNameAvailable(expressionName: string, sheetId: number | undefined): boolean {
    if (sheetId === undefined) {
      return this.workbookStore.isNameAvailable(expressionName)
    } else {
      return this.worksheetStore(sheetId).isNameAvailable(expressionName)
    }
  }

  public namedExpressionInAddress(row: number): Maybe<NamedExpression> {
    const namedExpression = this.addressCache.get(row)
    if (namedExpression && namedExpression.added) {
      return namedExpression
    } else {
      return undefined
    }
  }

  public namedExpressionForScope(expressionName: string, sheetId: number | undefined): Maybe<NamedExpression> {
    if (sheetId === undefined) {
      return this.workbookStore.getExisting(expressionName)
    } else {
      return this.worksheetStore(sheetId).get(expressionName)
    }
  }

  public nearestNamedExpression(expressionName: string, sheetId: number): Maybe<NamedExpression> {
    return this.worksheetStore(sheetId).get(expressionName) || this.workbookStore.getExisting(expressionName)
  }

  public isNameValid(expressionName: string): boolean {
    if (/^[A-Za-z]+[0-9]+$/.test(expressionName)) {
      return false
    }
    return /^[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF\._]*$/.test(expressionName)
  }

  public addNamedExpression(expressionName: string, sheetId: number | undefined): NamedExpression {
    if (!this.isNameValid(expressionName)) {
      throw new Error('Name of Named Expression is invalid')
    }
    if (!this.isNameAvailable(expressionName, sheetId)) {
      throw new Error('Name of Named Expression already taken')
    }
    if (sheetId === undefined) {
      let namedExpression = this.workbookStore.get(expressionName)
      if (namedExpression) {
        namedExpression.added = true
        namedExpression.displayName = expressionName
      } else {
        namedExpression = new NamedExpression(expressionName, this.nextAddress(), true)
        this.workbookStore.add(namedExpression)
      }
      this.addressCache.set(namedExpression.address.row, namedExpression)
      return namedExpression
    } else {
      const store = this.worksheetStore(sheetId)
      const namedExpression = new NamedExpression(expressionName, this.nextAddress(), true)
      store.add(namedExpression)
      this.addressCache.set(namedExpression.address.row, namedExpression)
      return namedExpression
    }
  }

  private worksheetStore(sheetId: number) {
    let store = this.worksheetStores.get(sheetId)
    if (!store) {
      store = new WorksheetStore()
      this.worksheetStores.set(sheetId, store)
    }
    return store
  }

  public namedExpressionOrPlaceholder(expressionName: string, sheetId: number): NamedExpression {
    const namedExpression = this.worksheetStore(sheetId).get(expressionName)
    if (namedExpression) {
      return namedExpression
    } else {
      let namedExpression = this.workbookStore.get(expressionName)
      if (namedExpression === undefined) {
        namedExpression = new NamedExpression(expressionName, this.nextAddress(), false)
        this.workbookStore.add(namedExpression)
      }
      return namedExpression
    }
  }

  public workbookNamedExpressionOrPlaceholder(expressionName: string): NamedExpression {
    let namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      namedExpression = new NamedExpression(expressionName, this.nextAddress(), false)
      this.workbookStore.add(namedExpression)
    }
    return namedExpression
  }

  public remove(expressionName: string, sheetId: number | undefined): void {
    let store
    if (sheetId === undefined) {
      store = this.workbookStore
    } else {
      store = this.worksheetStore(sheetId)
    }
    const namedExpression = store.get(expressionName)
    if (namedExpression === undefined || !namedExpression.added) {
      throw 'Named expression does not exist'
    }
    store.remove(expressionName)
    this.addressCache.delete(namedExpression.address.row)
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.workbookStore.getAllNamedExpressions().map((ne) => ne.displayName)
  }

  private nextAddress() {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, this.nextNamedExpressionRow++)
  }
}
