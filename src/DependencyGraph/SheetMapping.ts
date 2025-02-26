/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {NoSheetWithIdError, NoSheetWithNameError, SheetNameAlreadyTakenError} from '../errors'
import {TranslationPackage, UIElement} from '../i18n'
import {Maybe} from '../Maybe'

function canonicalize(sheetDisplayName: string): string {
  return sheetDisplayName.toLowerCase()
}

class Sheet {
  constructor(
    public readonly id: number,
    public displayName: string,
  ) {
  }

  public get canonicalName() {
    return canonicalize(this.displayName)
  }
}

export class SheetMapping {
  private readonly mappingFromCanonicalName: Map<string, Sheet> = new Map()
  private readonly mappingFromId: Map<number, Sheet> = new Map()
  private readonly sheetNamePrefix: string
  private lastSheetId = -1

  constructor(private languages: TranslationPackage) {
    this.sheetNamePrefix = languages.getUITranslation(UIElement.NEW_SHEET_PREFIX)
  }

  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    const newSheetCanonicalName = canonicalize(newSheetDisplayName)
    if (this.mappingFromCanonicalName.has(newSheetCanonicalName)) {
      throw new SheetNameAlreadyTakenError(newSheetDisplayName)
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.store(sheet)
    return sheet.id
  }

  public removeSheet(sheetId: number) {
    const sheet = this.fetchSheetById(sheetId)
    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mappingFromCanonicalName.delete(sheet.canonicalName)
    this.mappingFromId.delete(sheet.id)
  }

  public fetch = (sheetName: string): number => {
    const sheet = this.mappingFromCanonicalName.get(canonicalize(sheetName))
    if (sheet === undefined) {
      throw new NoSheetWithNameError(sheetName)
    }
    return sheet.id
  }

  public get = (sheetName: string): Maybe<number> => {
    return this.mappingFromCanonicalName.get(canonicalize(sheetName))?.id
  }

  public fetchDisplayName = (sheetId: number): string => {
    return this.fetchSheetById(sheetId).displayName
  }

  public getDisplayName(sheetId: number): Maybe<string> {
    return this.mappingFromId.get(sheetId)?.displayName
  }

  public* displayNames(): IterableIterator<string> {
    for (const sheet of this.mappingFromCanonicalName.values()) {
      yield sheet.displayName
    }
  }

  public numberOfSheets(): number {
    return this.mappingFromCanonicalName.size
  }

  public hasSheetWithId(sheetId: number): boolean {
    return this.mappingFromId.has(sheetId)
  }

  public hasSheetWithName(sheetName: string): boolean {
    return this.mappingFromCanonicalName.has(canonicalize(sheetName))
  }

  public renameSheet(sheetId: number, newDisplayName: string): Maybe<string> {
    const sheet = this.fetchSheetById(sheetId)

    const currentDisplayName = sheet.displayName
    if (currentDisplayName === newDisplayName) {
      return undefined
    }

    const sheetWithThisCanonicalName = this.mappingFromCanonicalName.get(canonicalize(newDisplayName))
    if (sheetWithThisCanonicalName !== undefined && sheetWithThisCanonicalName.id !== sheet.id) {
      throw new SheetNameAlreadyTakenError(newDisplayName)
    }

    const currentCanonicalName = sheet.canonicalName
    this.mappingFromCanonicalName.delete(currentCanonicalName)

    sheet.displayName = newDisplayName
    this.store(sheet)
    return currentDisplayName
  }

  public sheetNames(): string[] {
    return Array.from(this.mappingFromId.values()).map((s) => s.displayName)
  }

  private store(sheet: Sheet): void {
    this.mappingFromId.set(sheet.id, sheet)
    this.mappingFromCanonicalName.set(sheet.canonicalName, sheet)
  }

  private fetchSheetById(sheetId: number): Sheet {
    const sheet = this.mappingFromId.get(sheetId)
    if (sheet === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }
    return sheet
  }
}
