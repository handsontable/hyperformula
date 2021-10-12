/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {Maybe} from './Maybe'
import {Ast, AstNodeType} from './parser'

export interface NamedExpression {
  name: string,
  scope?: number,
  expression?: string,
  options?: NamedExpressionOptions,
}

export type NamedExpressionOptions = Record<string, string | number | boolean>

export class InternalNamedExpression {
  constructor(
    public displayName: string,
    public readonly address: SimpleCellAddress,
    public added: boolean,
    public options?: NamedExpressionOptions
  ) {
  }

  public normalizeExpressionName(): string {
    return this.displayName.toLowerCase()
  }

  public copy(): InternalNamedExpression {
    return new InternalNamedExpression(this.displayName, this.address, this.added, this.options)
  }
}

class WorkbookStore {
  private readonly mapping = new Map<string, InternalNamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    return !(namedExpression && namedExpression.added)
  }

  public add(namedExpression: InternalNamedExpression): void {
    this.mapping.set(namedExpression.normalizeExpressionName(), namedExpression)
  }

  public get(expressionName: string): Maybe<InternalNamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public getExisting(expressionName: string): Maybe<InternalNamedExpression> {
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

  public getAllNamedExpressions(): InternalNamedExpression[] {
    return Array.from(this.mapping.values()).filter((ne: InternalNamedExpression) => ne.added)
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }
}

class WorksheetStore {
  public readonly mapping = new Map<string, InternalNamedExpression>()

  public add(namedExpression: InternalNamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.displayName), namedExpression)
  }

  public get(expressionName: string): Maybe<InternalNamedExpression> {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public getAllNamedExpressions(): InternalNamedExpression[] {
    return Array.from(this.mapping.values()).filter((ne: InternalNamedExpression) => ne.added)
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

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }
}

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  private readonly workbookStore: WorkbookStore = new WorkbookStore()
  private readonly worksheetStores: Map<number, WorksheetStore> = new Map()
  private readonly addressCache: Map<number, InternalNamedExpression> = new Map()

  public isNameAvailable(expressionName: string, sheetId?: number): boolean {
    if (sheetId === undefined) {
      return this.workbookStore.isNameAvailable(expressionName)
    } else {
      return this.worksheetStore(sheetId)?.isNameAvailable(expressionName) ?? true
    }
  }

  public namedExpressionInAddress(row: number): Maybe<InternalNamedExpression> {
    const namedExpression = this.addressCache.get(row)
    if (namedExpression && namedExpression.added) {
      return namedExpression
    } else {
      return undefined
    }
  }

  public namedExpressionForScope(expressionName: string, sheetId?: number): Maybe<InternalNamedExpression> {
    if (sheetId === undefined) {
      return this.workbookStore.getExisting(expressionName)
    } else {
      return this.worksheetStore(sheetId)?.get(expressionName)
    }
  }

  public nearestNamedExpression(expressionName: string, sheetId: number): Maybe<InternalNamedExpression> {
    return this.worksheetStore(sheetId)?.get(expressionName) ?? this.workbookStore.getExisting(expressionName)
  }

  public isExpressionInScope(expressionName: string, sheetId: number): boolean {
    return this.worksheetStore(sheetId)?.has(expressionName) ?? false
  }

  public isNameValid(expressionName: string): boolean {
    if (/^[A-Za-z]+[0-9]+$/.test(expressionName)) {
      return false
    }
    return /^[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF._]*$/.test(expressionName)
  }

  public addNamedExpression(expressionName: string, sheetId?: number, options?: NamedExpressionOptions): InternalNamedExpression {
    const store = sheetId === undefined ? this.workbookStore : this.worksheetStoreOrCreate(sheetId)
    let namedExpression = store.get(expressionName)
    if (namedExpression !== undefined) {
      namedExpression.added = true
      namedExpression.displayName = expressionName
      namedExpression.options = options
    } else {
      namedExpression = new InternalNamedExpression(expressionName, this.nextAddress(), true, options)
      store.add(namedExpression)
    }
    this.addressCache.set(namedExpression.address.row, namedExpression)
    return namedExpression
  }

  public restoreNamedExpression(namedExpression: InternalNamedExpression, sheetId?: number): InternalNamedExpression {
    const store = sheetId === undefined ? this.workbookStore : this.worksheetStoreOrCreate(sheetId)
    namedExpression.added = true
    store.add(namedExpression)
    this.addressCache.set(namedExpression.address.row, namedExpression)
    return namedExpression
  }

  public namedExpressionOrPlaceholder(expressionName: string, sheetId: number): InternalNamedExpression {
    return this.worksheetStoreOrCreate(sheetId).get(expressionName) ?? this.workbookNamedExpressionOrPlaceholder(expressionName)
  }

  public workbookNamedExpressionOrPlaceholder(expressionName: string): InternalNamedExpression {
    let namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      namedExpression = new InternalNamedExpression(expressionName, this.nextAddress(), false)
      this.workbookStore.add(namedExpression)
    }
    return namedExpression
  }

  public remove(expressionName: string, sheetId?: number): void {
    let store
    if (sheetId === undefined) {
      store = this.workbookStore
    } else {
      store = this.worksheetStore(sheetId)
    }
    const namedExpression = store?.get(expressionName)
    if (store === undefined || namedExpression === undefined || !namedExpression.added) {
      throw 'Named expression does not exist'
    }
    store.remove(expressionName)
    if (store instanceof WorksheetStore && store.mapping.size === 0) {
      this.worksheetStores.delete(sheetId!)
    }
    this.addressCache.delete(namedExpression.address.row)
  }

  public getAllNamedExpressionsNamesInScope(sheetId?: number): string[] {
    return this.getAllNamedExpressions().filter(({scope}) => scope === sheetId).map((ne) => ne.expression.displayName)
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.getAllNamedExpressions().map((ne) => ne.expression.displayName)
  }

  public getAllNamedExpressions(): { expression: InternalNamedExpression, scope?: number }[] {
    const storedNamedExpressions: { expression: InternalNamedExpression, scope?: number }[] = []

    this.workbookStore.getAllNamedExpressions().forEach(expr => {
      storedNamedExpressions.push({
        expression: expr,
        scope: undefined
      })
    })

    this.worksheetStores.forEach((store, sheetNum) => {
      store.getAllNamedExpressions().forEach(expr => {
        storedNamedExpressions.push({
          expression: expr,
          scope: sheetNum
        })
      })
    })

    return storedNamedExpressions
  }

  public getAllNamedExpressionsForScope(scope?: number): InternalNamedExpression[] {
    if (scope === undefined) {
      return this.workbookStore.getAllNamedExpressions()
    } else {
      return this.worksheetStores.get(scope)?.getAllNamedExpressions() ?? []
    }
  }

  private worksheetStoreOrCreate(sheetId: number): WorksheetStore {
    let store = this.worksheetStores.get(sheetId)
    if (!store) {
      store = new WorksheetStore()
      this.worksheetStores.set(sheetId, store)
    }
    return store
  }

  private worksheetStore(sheetId: number): Maybe<WorksheetStore> {
    return this.worksheetStores.get(sheetId)
  }

  private nextAddress() {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, this.nextNamedExpressionRow++)
  }
}

export const doesContainRelativeReferences = (ast: Ast): boolean => {
  switch (ast.type) {
    case AstNodeType.EMPTY:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
    case AstNodeType.ERROR_WITH_RAW_INPUT:
      return false
    case AstNodeType.CELL_REFERENCE:
      return !ast.reference.isAbsolute()
    case AstNodeType.CELL_RANGE:
    case AstNodeType.COLUMN_RANGE:
    case AstNodeType.ROW_RANGE:
      return !ast.start.isAbsolute()
    case AstNodeType.NAMED_EXPRESSION:
      return false
    case AstNodeType.PERCENT_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.MINUS_UNARY_OP: {
      return doesContainRelativeReferences(ast.value)
    }
    case AstNodeType.CONCATENATE_OP:
    case AstNodeType.EQUALS_OP:
    case AstNodeType.NOT_EQUAL_OP:
    case AstNodeType.LESS_THAN_OP:
    case AstNodeType.GREATER_THAN_OP:
    case AstNodeType.LESS_THAN_OR_EQUAL_OP:
    case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
    case AstNodeType.MINUS_OP:
    case AstNodeType.PLUS_OP:
    case AstNodeType.TIMES_OP:
    case AstNodeType.DIV_OP:
    case AstNodeType.POWER_OP:
      return doesContainRelativeReferences(ast.left) || doesContainRelativeReferences(ast.right)
    case AstNodeType.PARENTHESIS:
      return doesContainRelativeReferences(ast.expression)
    case AstNodeType.FUNCTION_CALL: {
      return ast.args.some((arg) =>
        doesContainRelativeReferences(arg)
      )
    }
    case AstNodeType.ARRAY: {
      return ast.args.some(row => row.some(arg => doesContainRelativeReferences(arg)))
    }
  }
}
