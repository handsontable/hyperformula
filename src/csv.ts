import parse from 'csv-parse/lib/sync'
import stringify from 'csv-stringify/lib/sync'
import {CellError, CellValue, Config, EmptyValue, HandsOnEngine, Sheets} from './'

export type CsvSheets = Record<string, string>

function cellValueToCsvString(value: CellValue): string {
  if (value === EmptyValue) {
    return ''
  } else if (value instanceof CellError) {
    return `#${value.type}!`
  } else {
    return value.toString()
  }
}

export class CsvExporter {
  constructor(
    public readonly csvDelimiter: string = ',',
  ) {
  }

  /**
   * Creates CSV string out of sheet content
   */
  public exportSheetByName(engine: HandsOnEngine, sheetName: string): string {
    const sheet = engine.sheetMapping.fetch(sheetName)
    const values = engine.getValues(sheet).map((row) => row.map(cellValueToCsvString))
    return stringify(values, {
      delimiter: this.csvDelimiter,
    })
  }

  public exportAllSheets(engine: HandsOnEngine): CsvSheets {
    const sheets: CsvSheets = {}
    for (const sheetName of engine.sheetMapping.names()) {
      sheets[sheetName] = this.exportSheetByName(engine, sheetName)
    }
    return sheets
  }
}

export class CsvImporter {
  constructor(
    public readonly csvDelimiter: string = ',',
  ) {
  }

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public importSheet(csv: string, config: Config = new Config()): HandsOnEngine {
    return HandsOnEngine.buildFromArray(this.csvSheetToSheet(csv), config)
  }

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public importSheets(csvSheets: CsvSheets, config: Config = new Config()): HandsOnEngine {
    return HandsOnEngine.buildFromSheets(this.csvSheetsToSheets(csvSheets), config)
  }

  public csvSheetsToSheets(csvSheets: CsvSheets): Sheets {
    const sheets: Sheets = {}
    for (const key of Object.keys(csvSheets)) {
      sheets[key] = this.csvSheetToSheet(csvSheets[key])
    }
    return sheets
  }

  public csvSheetToSheet(csv: string): string[][] {
    return parse(csv, { delimiter: this.csvDelimiter })
  }
}
