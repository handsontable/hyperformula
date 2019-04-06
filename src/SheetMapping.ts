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
}
