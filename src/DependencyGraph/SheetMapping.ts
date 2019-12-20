import {TranslationPackage} from '../i18n'

class Sheet {
  constructor(
    public readonly id: number,
    public displayName: string,
  ) {
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
    if (this.mapping.has(sheetName)) {
      throw new Error(`Sheet ${sheetName} already exists`)
    }


    this.lastSheetId++
    const sheet = new Sheet(this.lastSheetId, sheetName)
    this.reversedMapping.set(sheet.id, sheet)
    this.mapping.set(sheet.displayName, sheet)
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
    this.mapping.delete(sheet.displayName)
    this.reversedMapping.delete(sheetId)
  }

  public fetch = (sheetName: string): number => {
    const sheet = this.mapping.get(sheetName)
    if (sheet === undefined) {
      throw new Error(`Sheet ${sheetName} doesn't exist`)
    }
    return sheet.id
  }

  public get = (sheetName: string): number | undefined => {
    const sheet = this.mapping.get(sheetName)
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

  public names(): IterableIterator<string> {
    return this.mapping.keys()
  }

  public numberOfSheets(): number {
    return this.mapping.size
  }

  public hasSheetWithId(sheetId: number): boolean {
    return this.reversedMapping.has(sheetId)
  }

  public hasSheetWithName(sheetName: string): boolean {
    return this.mapping.has(sheetName)
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
    if (this.mapping.has(newName)) {
      throw new Error(`Sheet '${newName}' already exists`)
    }

    sheet.displayName = newName
    this.mapping.delete(currentName)
    this.mapping.set(newName, sheet)
    this.reversedMapping.delete(sheetId)
    this.reversedMapping.set(sheetId, sheet)
  }

  public destroy(): void {
    this.mapping.clear()
    this.reversedMapping.clear()
  }
}
