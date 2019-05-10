export class SheetMapping {
  private readonly mapping: Map<string, number> = new Map()
  private lastSheetId = -1

  public addSheet(sheetName: string): number {
    if (this.mapping.has(sheetName)) {
      throw new Error(`Sheet ${sheetName} already exists`)
    }

    this.lastSheetId++
    this.mapping.set(sheetName, this.lastSheetId)
    return this.lastSheetId
  }

  public fetch(sheetName: string): number {
    const sheetId = this.mapping.get(sheetName)
    if (sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} doesnt exist`)
    }
    return sheetId
  }

  public names(): IterableIterator<string> {
    return this.mapping.keys()
  }

  public sheetIds(): IterableIterator<number> {
    return this.mapping.values()
  }
}
