/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {NoSheetWithIdError, NoSheetWithNameError, SheetNameAlreadyTakenError} from '../errors'
import {TranslationPackage, UIElement} from '../i18n'
import {Maybe} from '../Maybe'

/**
 * Options for querying the sheet mapping.
 */
export interface SheetMappingQueryOptions {
  includeNotAdded?: boolean,
}

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
   * Returns sheet ID for the given name (case-insensitive). By default excludes not added sheets.
   *
   * @returns {Maybe<number>} the sheet ID, or undefined if not found.
   */
  public getSheetId(sheetName: string, options: SheetMappingQueryOptions = {}): Maybe<number> {
    return this._getSheetByName(sheetName, options)?.id
  }

  /**
   * Returns sheet ID for the given name. Excludes not added sheets.
   *
   * @throws {NoSheetWithNameError} if the sheet with the given name does not exist.
   */
  public getSheetIdOrThrowError(sheetName: string): number {
    const sheet = this._getSheetByName(sheetName, {})

    if (sheet === undefined) {
      throw new NoSheetWithNameError(sheetName)
    }
    return sheet.id
  }

  /**
   * Returns display name for the given sheet ID. Excludes not added sheets.
   *
   * @returns {Maybe<string>} the display name, or undefined if the sheet with the given ID does not exist.
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this._getSheet(sheetId, {})?.displayName
  }

  /**
   * Returns display name for the given sheet ID. Excludes not added sheets.
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   */
  public getSheetNameOrThrowError(sheetId: number): string {
    return this._getSheetOrThrowError(sheetId, {}).displayName
  }

  /**
   * Iterates over all sheet display names. By default excludes not added sheets.
   */
  public* iterateSheetNames(options: SheetMappingQueryOptions = {}): IterableIterator<string> {
    for (const sheet of this.allSheets.values()) {
      if (options.includeNotAdded || sheet.isAdded) {
        yield sheet.displayName
      }
    }
  }

  /**
   * Returns array of all sheet display names. By default excludes not added sheets.
   */
  public getSheetNames(options: SheetMappingQueryOptions = {}): string[] {
    return Array.from(this.iterateSheetNames(options))
  }

  /**
   * Returns total count of sheets. By default excludes not added sheets.
   */
  public numberOfSheets(options: SheetMappingQueryOptions = {}): number {
    return this.getSheetNames(options).length
  }

  /**
   * Checks if sheet with given ID exists. Excludes not added sheets.
   */
  public hasSheetWithId(sheetId: number): boolean {
    return this._getSheet(sheetId, {}) !== undefined
  }

  /**
   * Checks if sheet with given name exists (case-insensitive). Excludes not added sheets.
   */
  public hasSheetWithName(sheetName: string): boolean {
    return this._getSheetByName(sheetName, {}) !== undefined
  }

  /**
   * Adds new sheet with optional name and returns its ID.
   * If called with a reserved sheet name (sheet name of some sheet present in the mapping but not added yet), adds the reserved sheet.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   * @returns {number} the ID of the new sheet.
   */
  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    const sheetWithConflictingName = this._getSheetByName(newSheetDisplayName, { includeNotAdded: true })

    if (sheetWithConflictingName) {
      if (sheetWithConflictingName.isAdded) {
        throw new SheetNameAlreadyTakenError(newSheetDisplayName)
      }

      sheetWithConflictingName.isAdded = true
      return sheetWithConflictingName.id
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  /**
   * Stores the sheet in the mapping with flag isAdded=false.
   * If such sheet name is already present in the mapping, does nothing.
   *
   * @returns {number} the ID of the reserved sheet.
   */
  public reserveSheetName(sheetName: string): number {
    const sheetWithConflictingName = this._getSheetByName(sheetName, { includeNotAdded: true })

    if (sheetWithConflictingName) {
      return sheetWithConflictingName.id
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, sheetName, false)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  /**
   * Removes sheet with given ID. Ignores not added sheets.
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist or is not added yet.
   */
  public removeSheet(sheetId: number): void {
    const sheet = this._getSheetOrThrowError(sheetId, {})

    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mappingFromCanonicalNameToId.delete(sheet.canonicalName)
    this.allSheets.delete(sheet.id)
  }

  /**
   * Renames sheet.
   * If called with sheetId of a not added sheet, throws {NoSheetWithIdError}.
   * If newDisplayName is conflicting with an existing sheet, throws {SheetNameAlreadyTakenError}.
   * If newDisplayName is conflicting with a reserved sheet name (name of a non-added sheet), throws {SheetNameAlreadyTakenError}.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   * @returns {Maybe<string>} the old name, or undefined if the name was not changed.
   */
  public renameSheet(sheetId: number, newDisplayName: string): Maybe<string> {
    const sheet = this._getSheetOrThrowError(sheetId, {})

    const currentDisplayName = sheet.displayName
    if (currentDisplayName === newDisplayName) {
      return undefined
    }

    const sheetWithConflictingName = this._getSheetByName(newDisplayName, { includeNotAdded: true })
    if (sheetWithConflictingName !== undefined && sheetWithConflictingName.id !== sheet.id) {
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
  private _getSheet(sheetId: number, options: SheetMappingQueryOptions): Maybe<Sheet> {
    const retrievedSheet = this.allSheets.get(sheetId)

    if (retrievedSheet === undefined) {
      return undefined
    }

    return options.includeNotAdded || retrievedSheet.isAdded ? retrievedSheet : undefined
  }

  /**
   * Returns sheet by name
   *
   * @returns {Maybe<Sheet>} the sheet, or undefined if not found.
   * @internal
   */
  private _getSheetByName(sheetName: string, options: SheetMappingQueryOptions): Maybe<Sheet> {
    const sheetId = this.mappingFromCanonicalNameToId.get(SheetMapping.canonicalizeSheetName(sheetName))

    if (sheetId === undefined) {
      return undefined
    }

    return this._getSheet(sheetId, options)
  }

  /**
   * Returns sheet by ID
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   * @internal
   */
  private _getSheetOrThrowError(sheetId: number, options: SheetMappingQueryOptions): Sheet {
    const sheet = this._getSheet(sheetId, options)

    if (sheet === undefined) {
      throw new NoSheetWithIdError(sheetId)
    }

    return sheet
  }
}
