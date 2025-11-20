/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {NoSheetWithIdError, NoSheetWithNameError, SheetNameAlreadyTakenError} from '../errors'
import {TranslationPackage, UIElement} from '../i18n'
import {Maybe} from '../Maybe'

/**
 * Representation of a sheet internal to SheetMapping. Not exported outside of this file.
 */
class Sheet {
  constructor(
    public readonly id: number,
    public displayName: string,
    /**
     * Whether the sheet has been explicitly added to the instance either on initialization or via addSheet method.
     */
    public isAdded: boolean = true,
  ) {
  }

  /**
   * Returns the canonical (normalized) name of the sheet.
   */
  public get canonicalName(): string {
    return SheetMapping.canonicalizeSheetName(this.displayName)
  }
}

/**
 * Manages the sheets in the instance.
 * Stores ids, names and the mapping between them.
 *
 * TODO: describe isAdded: false situation
 */
export class SheetMapping {
  private readonly sheetNamePrefix: string
  private lastSheetId = -1
  private mappingFromCanonicalNameToId: Map<string, number> = new Map()
  private allSheets: Map<number, Sheet> = new Map()

  constructor(languages: TranslationPackage) {
    this.sheetNamePrefix = languages.getUITranslation(UIElement.NEW_SHEET_PREFIX)
  }

  /**
   * Converts sheet name to canonical/normalized form.
   */
  public static canonicalizeSheetName(sheetDisplayName: string): string {
    return sheetDisplayName.toLowerCase()
  }

  /**
   * Returns sheet ID for the given name (case-insensitive).
   *
   * @returns {Maybe<number>} the sheet ID, or undefined if not found.
   */
  public getSheetId(sheetName: string): Maybe<number> {
    return this.mappingFromCanonicalNameToId.get(SheetMapping.canonicalizeSheetName(sheetName))
  }

  /**
   * Returns sheet ID for the given name.
   *
   * @throws {NoSheetWithNameError} if the sheet with the given name does not exist.
   */
  public getSheetIdOrThrowError(sheetName: string): number {
    const sheetId = this.getSheetId(sheetName)

    if (sheetId === undefined) {
      throw new NoSheetWithNameError(sheetName)
    }
    return sheetId
  }

  /**
   * Returns display name for the given sheet ID.
   *
   * @returns {Maybe<string>} the display name, or undefined if the sheet with the given ID does not exist.
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this.getSheet(sheetId)?.displayName
  }

  /**
   * Returns display name for the given sheet ID.
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   */
  public getSheetNameOrThrowError(sheetId: number): string {
    return this.getSheetOrThrowError(sheetId).displayName
  }

  /**
   * Returns array of all sheet display names.
   */
  public getAllSheetNames(): string[] {
    return Array.from(this.iterateAllSheetNames())
  }

  /**
   * Iterates over all sheet display names.
   */
  public* iterateAllSheetNames(): IterableIterator<string> {
    for (const sheet of this.allSheets.values()) {
      yield sheet.displayName
    }
  }

  /**
   * Returns total count of sheets.
   */
  public numberOfSheets(): number {
    return this.allSheets.size
  }

  /**
   * Checks if sheet with given ID exists.
   */
  public hasSheetWithId(sheetId: number): boolean {
    return this.allSheets.has(sheetId)
  }

  /**
   * Checks if sheet with given name exists (case-insensitive).
   */
  public hasSheetWithName(sheetName: string): boolean {
    return this.mappingFromCanonicalNameToId.has(SheetMapping.canonicalizeSheetName(sheetName))
  }

  /**
   * Adds new sheet with optional name and returns its ID.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   * @returns {number} the ID of the new sheet.
   */
  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    if (this.hasSheetWithName(newSheetDisplayName)) {
      throw new SheetNameAlreadyTakenError(newSheetDisplayName)
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  /**
   * Removes sheet with given ID.
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   */
  public removeSheet(sheetId: number): void {
    const sheet = this.getSheetOrThrowError(sheetId)
    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mappingFromCanonicalNameToId.delete(sheet.canonicalName)
    this.allSheets.delete(sheet.id)
  }

  /**
   * Renames sheet and returns old name, or undefined if name unchanged.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   * @returns {Maybe<string>} the old name, or undefined if the name was not changed.
   */
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

  /**
   * Stores sheet in both internal mappings.
   *
   * If ID exists, it is updated. If not, it is added.
   * If canonical name exists, it is updated. If not, it is added.
   *
   * @internal
   */
  private storeSheetInMappings(sheet: Sheet): void {
    this.allSheets.set(sheet.id, sheet)
    this.mappingFromCanonicalNameToId.set(sheet.canonicalName, sheet.id)
  }

  /**
   * Returns sheet by ID
   *
   * @returns {Maybe<Sheet>} the sheet, or undefined if not found.
   * @internal
   */
  private getSheet(sheetId: number): Maybe<Sheet> {
    return this.allSheets.get(sheetId)
  }

  /**
   * Returns sheet by name
   *
   * @returns {Maybe<Sheet>} the sheet, or undefined if not found.
   * @internal
   */
  private getSheetByName(sheetName: string): Maybe<Sheet> {
    const sheetId = this.getSheetId(sheetName)

    if (sheetId === undefined) {
      return undefined
    }

    return this.getSheet(sheetId)
  }

  /**
   * Returns sheet by ID
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   * @internal
   */
  private getSheetOrThrowError(sheetId: number): Sheet {
    const sheet = this.getSheet(sheetId)

    if (sheet === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return sheet
  }
}
