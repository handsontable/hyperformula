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
  includePlaceholders?: boolean,
}

/**
 * Representation of a sheet internal to SheetMapping. Not exported outside of this file.
 */
class Sheet {
  constructor(
    public readonly id: number,
    public displayName: string,
    public isPlaceholder: boolean = false,
  ) {}

  /**
   * Returns the canonical (normalized) name of the sheet.
   */
  public get canonicalName(): string {
    return SheetMapping.canonicalizeSheetName(this.displayName)
  }
}

/**
 * Manages the sheets in the instance.
 * Can convert between sheet names and ids and vice versa.
 * Also stores placeholders for sheets that are used in formulas but not yet added. They are marked as isPlaceholder=true.
 * Sheetnames thet differ only in case are considered the same. (See: canonicalizeSheetName)
 */
export class SheetMapping {
  /**
   * Prefix for new sheet names if no name is provided by the user
   */
  private readonly sheetNamePrefix: string
  /**
   * Last used sheet ID. Used to generate new sheet IDs.
   */
  private lastSheetId = -1
  /**
   * Mapping from canonical sheet name to sheet ID.
   */
  private mappingFromCanonicalNameToId: Map<string, number> = new Map()
  /**
   * Mapping from sheet ID to sheet.
   */
  private allSheets: Map<number, Sheet> = new Map()

  constructor(languages: TranslationPackage) {
    this.sheetNamePrefix = languages.getUITranslation(UIElement.NEW_SHEET_PREFIX)
  }

  /**
   * Converts sheet name to canonical/normalized form.
   * @static
   */
  public static canonicalizeSheetName(sheetDisplayName: string): string {
    return sheetDisplayName.toLowerCase()
  }

  /**
   * Returns sheet ID for the given name. By default excludes placeholders.
   */
  public getSheetId(sheetName: string, options: SheetMappingQueryOptions = {}): Maybe<number> {
    return this._getSheetByName(sheetName, options)?.id
  }

  /**
   * Returns sheet ID for the given name. Excludes placeholders.
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
   * Returns display name for the given sheet ID. Excludes placeholders.
   *
   * @returns {Maybe<string>} the display name, or undefined if the sheet with the given ID does not exist.
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this._getSheet(sheetId, {})?.displayName
  }

  /**
   * Returns display name for the given sheet ID. Excludes placeholders.
   *
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   */
  public getSheetNameOrThrowError(sheetId: number, options: SheetMappingQueryOptions = {}): string {
    return this._getSheetOrThrowError(sheetId, options).displayName
  }

  /**
   * Iterates over all sheet display names. By default excludes placeholders.
   */
  public* iterateSheetNames(options: SheetMappingQueryOptions = {}): IterableIterator<string> {
    for (const sheet of this.allSheets.values()) {
      if (options.includePlaceholders || !sheet.isPlaceholder) {
        yield sheet.displayName
      }
    }
  }

  /**
   * Returns array of all sheet display names. By default excludes placeholders.
   */
  public getSheetNames(options: SheetMappingQueryOptions = {}): string[] {
    return Array.from(this.iterateSheetNames(options))
  }

  /**
   * Returns total count of sheets. By default excludes placeholders.
   */
  public numberOfSheets(options: SheetMappingQueryOptions = {}): number {
    return this.getSheetNames(options).length
  }

  /**
   * Checks if sheet with given ID exists. By default excludes placeholders.
   */
  public hasSheetWithId(sheetId: number, options: SheetMappingQueryOptions = {}): boolean {
    return this._getSheet(sheetId, options) !== undefined
  }

  /**
   * Checks if sheet with given name exists (case-insensitive). Excludes placeholders.
   */
  public hasSheetWithName(sheetName: string): boolean {
    return this._getSheetByName(sheetName, {}) !== undefined
  }

  /**
   * Adds new sheet with optional name and returns its ID.
   * If called with a name of placeholder sheet, adds the real sheet.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   */
  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    const sheetWithConflictingName = this._getSheetByName(newSheetDisplayName, { includePlaceholders: true })

    if (sheetWithConflictingName) {
      if (!sheetWithConflictingName.isPlaceholder) {
        throw new SheetNameAlreadyTakenError(newSheetDisplayName)
      }

      sheetWithConflictingName.isPlaceholder = false
      return sheetWithConflictingName.id
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  /**
   * Adds a placeholder sheet with the given name if it does not exist yet
   */
  public addPlaceholderIfNotExists(sheetName: string): number {
    const sheetWithConflictingName = this._getSheetByName(sheetName, { includePlaceholders: true })

    if (sheetWithConflictingName) {
      return sheetWithConflictingName.id
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, sheetName, true)
    this.storeSheetInMappings(sheet)
    return sheet.id
  }

  /**
   * Removes sheet with given ID. Ignores placeholders
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist or is a placeholder
   */
  public removeSheet(sheetId: number): void {
    const sheet = this._getSheetOrThrowError(sheetId, { includePlaceholders: false })
    this.allSheets.delete(sheetId)
    this.mappingFromCanonicalNameToId.delete(sheet.canonicalName)
  }

  /**
   * Marks sheet with given ID as a placeholder.
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist
   */
  public markSheetAsPlaceholder(sheetId: number): void {
    const sheet = this._getSheetOrThrowError(sheetId, {})
    sheet.isPlaceholder = true
  }

  /**
   * Renames sheet.
   * If called with sheetId of a placeholder sheet, throws {NoSheetWithIdError}.
   * If newDisplayName is conflicting with an existing sheet, throws {SheetNameAlreadyTakenError}.
   * If newDisplayName is conflicting with a placeholder sheet name, throws {SheetNameAlreadyTakenError}.
   *
   * @throws {SheetNameAlreadyTakenError} if the sheet with the given name already exists.
   * @throws {NoSheetWithIdError} if the sheet with the given ID does not exist.
   */
  public renameSheet(sheetId: number, newDisplayName: string): { previousDisplayName: Maybe<string>, mergedSheetWith?: number } {
    const sheet = this._getSheetOrThrowError(sheetId, {})

    const currentDisplayName = sheet.displayName
    if (currentDisplayName === newDisplayName) {
      return { previousDisplayName: undefined }
    }

    const sheetWithConflictingName = this._getSheetByName(newDisplayName, { includePlaceholders: true })
    let mergedSheetWith: number | undefined = undefined

    if (sheetWithConflictingName !== undefined && sheetWithConflictingName.id !== sheet.id) {
      if (!sheetWithConflictingName.isPlaceholder) {
        throw new SheetNameAlreadyTakenError(newDisplayName)
      } else {
        this.mappingFromCanonicalNameToId.delete(sheetWithConflictingName.canonicalName)
        this.allSheets.delete(sheetWithConflictingName.id)
        mergedSheetWith = sheetWithConflictingName.id
      }
    }

    const currentCanonicalName = sheet.canonicalName
    this.mappingFromCanonicalNameToId.delete(currentCanonicalName)

    sheet.displayName = newDisplayName
    this.storeSheetInMappings(sheet)
    return { previousDisplayName: currentDisplayName, mergedSheetWith }
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

    return (options.includePlaceholders || !retrievedSheet.isPlaceholder) ? retrievedSheet : undefined
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
