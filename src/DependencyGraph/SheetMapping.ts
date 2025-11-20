/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {NoSheetWithIdError, NoSheetWithNameError, SheetNameAlreadyTakenError} from '../errors'
import {TranslationPackage, UIElement} from '../i18n'
import {Maybe} from '../Maybe'

/**
 * TODO
 */
class Sheet {
  constructor(
    public readonly id: number,
    public displayName: string,
    public isAdded: boolean = true,
  ) {
  }

  public get canonicalName(): string {
    return SheetMapping.canonicalizeSheetName(this.displayName)
  }
}

/**
 * TODO
 *
 * - stores not added sheets
 */
export class SheetMapping {
  private readonly sheetNamePrefix: string
  private lastSheetId = -1
  private mappingFromCanonicalNameToId: Map<string, number> = new Map()
  private allSheets: Map<number, Sheet> = new Map()

  constructor(languages: TranslationPackage) {
    this.sheetNamePrefix = languages.getUITranslation(UIElement.NEW_SHEET_PREFIX)
  }

  public static canonicalizeSheetName(sheetDisplayName: string): string {
    return sheetDisplayName.toLowerCase()
  }

  public getSheetId(sheetName: string): Maybe<number> {
    return this.mappingFromCanonicalNameToId.get(SheetMapping.canonicalizeSheetName(sheetName))
  }

  public getSheetIdOrThrowError(sheetName: string): number {
    const sheetId = this.getSheetId(sheetName)

    if (sheetId === undefined) {
      throw new NoSheetWithNameError(sheetName)
    }
    return sheetId
  }

  public getSheetName(sheetId: number): Maybe<string> {
    return this.getSheet(sheetId)?.displayName
  }

  public getSheetNameOrThrowError(sheetId: number): string {
    return this.getSheetOrThrowError(sheetId).displayName
  }

  public getAllSheetNames(): string[] {
    return Array.from(this.iterateAllSheetNames())
  }

  public* iterateAllSheetNames(): IterableIterator<string> {
    for (const sheet of this.allSheets.values()) {
      yield sheet.displayName
    }
  }

  public numberOfSheets(): number {
    return this.allSheets.size
  }

  public hasSheetWithId(sheetId: number): boolean {
    return this.allSheets.has(sheetId)
  }

  public hasSheetWithName(sheetName: string): boolean {
    return this.mappingFromCanonicalNameToId.has(SheetMapping.canonicalizeSheetName(sheetName))
  }

  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    if (this.hasSheetWithName(newSheetDisplayName)) {
      throw new SheetNameAlreadyTakenError(newSheetDisplayName)
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  public removeSheet(sheetId: number): void {
    const sheet = this.getSheetOrThrowError(sheetId)
    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mappingFromCanonicalNameToId.delete(sheet.canonicalName)
    this.allSheets.delete(sheet.id)
  }

  public renameSheet(sheetId: number, newDisplayName: string): Maybe<string> {
    const sheet = this.getSheetOrThrowError(sheetId)

    const currentDisplayName = sheet.displayName
    if (currentDisplayName === newDisplayName) {
      return undefined
    }

    const sheetWithThisCanonicalName = this.getSheetByName(newDisplayName)
    if (sheetWithThisCanonicalName !== undefined && sheetWithThisCanonicalName.id !== sheet.id) {
      throw new SheetNameAlreadyTakenError(newDisplayName)
    }

    const currentCanonicalName = sheet.canonicalName
    this.mappingFromCanonicalNameToId.delete(currentCanonicalName)

    sheet.displayName = newDisplayName
    this.storeSheetInMappings(sheet)
    return currentDisplayName
  }

  private storeSheetInMappings(sheet: Sheet): void {
    this.allSheets.set(sheet.id, sheet)
    this.mappingFromCanonicalNameToId.set(sheet.canonicalName, sheet.id)
  }

  private getSheet(sheetId: number): Maybe<Sheet> {
    return this.allSheets.get(sheetId)
  }

  private getSheetByName(sheetName: string): Maybe<Sheet> {
    const sheetId = this.getSheetId(sheetName)

    if (sheetId === undefined) {
      return undefined
    }

    return this.getSheet(sheetId)
  }

  private getSheetOrThrowError(sheetId: number): Sheet {
    const sheet = this.getSheet(sheetId)

    if (sheet === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return sheet
  }
}
