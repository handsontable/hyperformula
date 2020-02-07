import {TranslationPackage} from '../i18n'

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
  private readonly sheetNamePrefix: string = 'Sheet'
  private lastSheetId = -1

  constructor(private languages: TranslationPackage) {
    this.sheetNamePrefix = languages.interface.NEW_SHEET_PREFIX || this.sheetNamePrefix
  }

  public addSheet(newSheetDisplayName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    const newSheetCanonicalName = canonicalize(newSheetDisplayName)
    if (this.mappingFromCanonicalName.has(newSheetCanonicalName)) {
      throw new Error(`Sheet ${newSheetDisplayName} already exists`)
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, newSheetDisplayName)
    this.store(sheet)
    return sheet.id
  }

  public addForeverSheetWithId(id: number): void {
    if (this.mappingFromId.has(id)) {
      throw new Error(`Sheet with ID ${id} already exists`)
    }
    if (id >= 0) {
      throw new Error(`Forever sheets need to be negative`)
    }
    const sheet = new Sheet(id, "")
    this.mappingFromId.set(sheet.id, sheet)
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
      throw new Error(`Sheet ${sheetName} doesn't exist`)
    }
    return sheet.id
  }

  public get = (sheetName: string): number | undefined => {
    const sheet = this.mappingFromCanonicalName.get(canonicalize(sheetName))
    if (sheet) {
      return sheet.id
    } else {
      return undefined
    }
  }

  public fetchDisplayName = (sheetId: number): string => {
    return this.fetchSheetById(sheetId).displayName
  }

  public getDisplayName(sheetId: number): string | undefined {
    const sheet = this.mappingFromId.get(sheetId)
    if (sheet) {
      return sheet.displayName
    } else {
      return undefined
    }
  }

  public* displayNames(): IterableIterator<string> {
    for (const sheet of this.mappingFromCanonicalName.values()) {
      if (sheet.id >= 0) {
        yield sheet.displayName
      }
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

  public renameSheet(sheetId: number, newDisplayName: string): void {
    const sheet = this.fetchSheetById(sheetId)

    const currentDisplayName = sheet.displayName
    if (currentDisplayName === newDisplayName) {
      return
    }

    const sheetWithThisCanonicalName = this.mappingFromCanonicalName.get(canonicalize(newDisplayName))
    if (sheetWithThisCanonicalName && sheetWithThisCanonicalName.id !== sheet.id) {
      throw new Error(`Sheet '${newDisplayName}' already exists`)
    }

    const currentCanonicalName = sheet.canonicalName
    this.mappingFromCanonicalName.delete(currentCanonicalName)

    sheet.displayName = newDisplayName
    this.store(sheet)
  }

  public destroy(): void {
    this.mappingFromCanonicalName.clear()
    this.mappingFromId.clear()
  }

  private store(sheet: Sheet): void {
    this.mappingFromId.set(sheet.id, sheet)
    this.mappingFromCanonicalName.set(sheet.canonicalName, sheet)
  }

  private fetchSheetById(sheetId: number): Sheet {
    const sheet = this.mappingFromId.get(sheetId)
    if (sheet === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    return sheet
  }
}
