export class SheetMapping {
  private readonly mapping: Map<string, number> = new Map()
  private readonly reversedMapping: Map<number, string> = new Map()
  private lastSheetId = -1

  public addSheet(sheetName: string = `Sheet${this.lastSheetId + 2}`): number {
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

  public name = (sheetId: number): string => {
    const name = this.reversedMapping.get(sheetId)
    if (name === undefined) {
      throw new Error(`Sheet with id ${sheetId} doesn't exist`)
    }
    return name
  }

  public names(): IterableIterator<string> {
    return this.mapping.keys()
  }

  public numberOfSheets(): number {
    return this.mapping.size
  }
}
