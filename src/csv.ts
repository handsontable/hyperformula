import stringify from 'csv-stringify/lib/sync'
import {HandsOnEngine} from './'

export interface Sheets {
  [sheetName: string]: string
}

export class Exporter {
  constructor(
    public readonly csvDelimiter: string = ","
  ) {
  }

  /**
   * Creates CSV string out of sheet content
   */
  public exportSheetByName(engine: HandsOnEngine, sheetName: string): string {
    const sheet = engine.sheetMapping.fetch(sheetName)
    return stringify(engine.getValues(sheet), {
      delimiter: this.csvDelimiter
    })
  }

  public exportAllSheets(engine: HandsOnEngine): Sheets {
    const sheets: Sheets = {}
    for (const sheetName of engine.sheetMapping.names()) {
      sheets[sheetName] = this.exportSheetByName(engine, sheetName)
    }
    return sheets
  }
}
