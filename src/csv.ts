import stringify from 'csv-stringify/lib/sync'
import parse from 'csv-parse/lib/sync'
import {HandsOnEngine, Config, Sheets as RegularSheets} from './'

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

export class Importer {
  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public importSheet(csv: string, config: Config = new Config()): HandsOnEngine {
    const sheet = parse(csv, { delimiter: config.csvDelimiter })
    return HandsOnEngine.buildFromArray(sheet, config)
  }

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public importSheets(csvSheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const sheets: RegularSheets = {}
    for (const key of Object.keys(csvSheets)) {
      sheets[key] = parse(csvSheets[key], { delimiter: config.csvDelimiter })
    }
    return HandsOnEngine.buildFromSheets(sheets, config)
  }
}
