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
  private readonly mapping: Map<string, Sheet> = new Map()
  private readonly reversedMapping: Map<number, Sheet> = new Map()
  private readonly sheetNamePrefix: string = 'Sheet'
  private lastSheetId = -1

  constructor(private languages: TranslationPackage) {
    this.sheetNamePrefix = languages.interface.NEW_SHEET_PREFIX || this.sheetNamePrefix
  }

  public addSheet(sheetName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    const newSheetCanonicalName = canonicalize(sheetName)
    if (this.mapping.has(newSheetCanonicalName)) {
      throw new Error(`Sheet ${sheetName} already exists`)
    }

    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, sheetName)
    this.reversedMapping.set(sheet.id, sheet)
    this.mapping.set(sheet.canonicalName, sheet)
    return sheet.id
  }

  public removeSheet(sheetId: number) {
    const sheet = this.reversedMapping.get(sheetId)
    if (sheet === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mapping.delete(sheet.canonicalName)
    this.reversedMapping.delete(sheetId)
  }

  public fetch = (sheetName: string): number => {
    const sheet = this.mapping.get(canonicalize(sheetName))
    if (sheet === undefined) {
      throw new Error(`Sheet ${sheetName} doesn't exist`)
    }
    return sheet.id
  }

  public get = (sheetName: string): number | undefined => {
    const sheet = this.mapping.get(canonicalize(sheetName))
    if (sheet) {
      return sheet.id
    } else {
      return undefined
    }
  }

  public name = (sheetId: number): string => {
    const sheet = this.reversedMapping.get(sheetId)
    if (sheet === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    return sheet.displayName
  }

  public getName(sheetId: number): string | undefined {
    const sheet = this.reversedMapping.get(sheetId)
    if (sheet) {
      return sheet.displayName
    } else {
      return undefined
    }
  }

  public* names(): IterableIterator<string> {
    for (const sheet of this.mapping.values()) {
      yield sheet.displayName
    }
  }

  public numberOfSheets(): number {
    return this.mapping.size
  }

  public hasSheetWithId(sheetId: number): boolean {
    return this.reversedMapping.has(sheetId)
  }

  public hasSheetWithName(sheetName: string): boolean {
    return this.mapping.has(canonicalize(sheetName))
  }

  public renameSheet(sheetId: number, newName: string): void {
    const sheet = this.reversedMapping.get(sheetId)
    if (sheet === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    const currentName = sheet.displayName
    if (currentName === newName) {
      return
    }
    const sheetWithThisCanonicalName = this.mapping.get(canonicalize(newName))
    if (sheetWithThisCanonicalName && sheetWithThisCanonicalName.id !== sheetId) {
      throw new Error(`Sheet '${newName}' already exists`)
    }

    const currentCanonicalName = sheet.canonicalName
    sheet.displayName = newName
    this.mapping.delete(currentCanonicalName)
    this.mapping.set(sheet.canonicalName, sheet)
    this.reversedMapping.delete(sheetId)
    this.reversedMapping.set(sheetId, sheet)
  }

  public destroy(): void {
    this.mapping.clear()
    this.reversedMapping.clear()
  }
}
