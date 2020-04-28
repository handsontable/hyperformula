/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {Maybe} from './Maybe'

export class NamedExpression {
  constructor(
    public name: string,
    public readonly address: SimpleCellAddress,
    public added: boolean,
  ) {
  }
  
  public get displayName(): string {
    return this.name
  }
}

class NamedExpressionsStore {
  private readonly mapping = new Map<string, NamedExpression>()
  private readonly rowMapping = new Map<number, NamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    return !(namedExpression && namedExpression.added)
  }

  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.name), namedExpression)
    this.rowMapping.set(namedExpression.address.row, namedExpression)
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
    this.mapping.set(this.normalizeExpressionName(namedExpression.name), namedExpression)
  }

  public get(expressionName: string): Maybe<NamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
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
  public readonly workbookStore: NamedExpressionsStore = new NamedExpressionsStore()
  public readonly worksheetStores: Map<number, WorksheetStore> = new Map()

  constructor(
  ) {
  }

  public doesNamedExpressionExist(expressionName: string): boolean {
    return this.workbookStore.has(expressionName)
  }

  public isNameAvailable(expressionName: string, sheetId: number | undefined): boolean {
    if (sheetId === undefined) {
      return this.workbookStore.isNameAvailable(expressionName)
    } else {
      return true
    }
  }

  public fetchNameForNamedExpressionRow(row: number): string {
    let namedExpression = this.workbookStore.getByRow(row)
    if (!namedExpression) {
      for (const store of this.worksheetStores.values()) {
        for (const worksheetNamedExpression of store.mapping.values()) {
          if (worksheetNamedExpression.address.row === row) {
            return worksheetNamedExpression.name
          }
        }
      }
    }
    // maybe rowmapping should be on other level
    if (!namedExpression) {
      throw new Error('Requested Named Expression does not exist')
    }
    return namedExpression.name
  }

  public getDisplayNameByNameForScope(expressionName: string, sheetId: number | undefined): Maybe<string> {
    let namedExpression
    if (sheetId === undefined) {
      namedExpression = this.workbookStore.get(expressionName)
    } else {
      namedExpression = this.worksheetStore(sheetId).get(expressionName)
    }
    if (namedExpression) {
      return namedExpression.name
    } else {
      return undefined
    }
  }

  public nearestNamedExpression(expressionName: string, sheetId: number): Maybe<NamedExpression> {
    return this.worksheetStore(sheetId).get(expressionName) || this.workbookStore.get(expressionName)
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
        namedExpression.name = expressionName
      } else {
        namedExpression = new NamedExpression(expressionName, this.nextAddress(), true)
        this.workbookStore.add(namedExpression)
      }
      return namedExpression
    } else {
      const store = this.worksheetStore(sheetId)
      // if (store.has(expressionName)) {
      //   throw new Error('Name of Named Expression already taken')
      // }
      const namedExpression = new NamedExpression(expressionName, this.nextAddress(), true)
      store.add(namedExpression)
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

  public getInternalNamedExpressionAddress(expressionName: string): Maybe<SimpleCellAddress> {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined || !namedExpression.added) {
      return undefined
    } else {
      return namedExpression.address
    }
  }

  public getGuessedInternalNamedExpressionAddress(expressionName: string, sheetId: number): Maybe<SimpleCellAddress> {
    const namedExpression = this.worksheetStore(sheetId).get(expressionName)
    if (namedExpression) {
      return namedExpression.address
    } else {
      const namedExpression = this.workbookStore.get(expressionName)
      if (namedExpression === undefined || !namedExpression.added) {
        return undefined
      } else {
        return namedExpression.address
      }
    }
  }

  public getInternalNamedExpressionAddressFromScope(expressionName: string, sheetId: number | undefined): Maybe<SimpleCellAddress> {
    let store: NamedExpressionsStore | WorksheetStore
    if (sheetId === undefined) {
      store = this.workbookStore
    } else {
      store = this.worksheetStore(sheetId)
    }
    const namedExpression = store.get(expressionName)
    if (namedExpression === undefined || !namedExpression.added) {
      return undefined
    } else {
      return namedExpression.address
    }
  }

  public getInternalMaybeNotAddedNamedExpressionAddress(expressionName: string, sheetId: number): SimpleCellAddress {
    const namedExpression = this.worksheetStore(sheetId).get(expressionName)
    if (namedExpression) {
      return namedExpression.address
    } else {
      let namedExpression = this.workbookStore.get(expressionName)
      if (namedExpression === undefined) {
        namedExpression = new NamedExpression(expressionName, this.nextAddress(), false)
        this.workbookStore.add(namedExpression)
      }
      return namedExpression.address
    }
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
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.workbookStore.getAllNamedExpressions().map((ne) => ne.name)
  }

  private nextAddress() {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, this.nextNamedExpressionRow++)
  }
}
