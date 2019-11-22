import {TranslationPackage} from "../i18n";
export class SheetMapping {
  private readonly mapping: Map<string, number> = new Map()
  private readonly reversedMapping: Map<number, string> = new Map()
  private readonly sheetNamePrefix: string = 'Sheet'
  private lastSheetId = -1

  constructor(private languages: TranslationPackage) {
    this.sheetNamePrefix = languages.interface['NEW_SHEET_PREFIX'] || this.sheetNamePrefix
  }

  public addSheet(sheetName: string = `${this.sheetNamePrefix}${this.lastSheetId + 2}`): number {
    if (this.mapping.has(sheetName)) {
      throw new Error(`Sheet ${sheetName} already exists`)
    }

    this.lastSheetId++
    this.reversedMapping.set(this.lastSheetId, sheetName)
    this.mapping.set(sheetName, this.lastSheetId)
    return this.lastSheetId
  }

  public removeSheet(sheetId: number) {
    const sheetName = this.reversedMapping.get(sheetId)
    if (sheetName === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    if (sheetId == this.lastSheetId) {
      --this.lastSheetId
    }
    this.mapping.delete(sheetName)
    this.reversedMapping.delete(sheetId)
  }

  public fetch = (sheetName: string): number => {
    const sheetId = this.mapping.get(sheetName)
    if (sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} doesn't exist`)
    }
    return sheetId
  }

  public get = (sheetName: string): number | undefined => {
    return this.mapping.get(sheetName)
  }

  public name = (sheetId: number): string => {
    const name = this.reversedMapping.get(sheetId)
    if (name === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    return name
  }

  public getName(sheetId: number): string | undefined {
    return this.reversedMapping.get(sheetId)
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
    const currentName = this.reversedMapping.get(sheetId)
    if (currentName === newName) {
      return
    }
    if (currentName === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    if (this.mapping.has(newName)) {
      throw new Error(`Sheet '${newName}' already exists`)
    }

    this.mapping.delete(currentName)
    this.mapping.set(newName, sheetId)
    this.reversedMapping.delete(sheetId)
    this.reversedMapping.set(sheetId, newName)
  }
}
