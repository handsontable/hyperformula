import parse from 'csv-parse/lib/sync'
import stringify from 'csv-stringify/lib/sync'
import {AddressMapping, SerializedMapping} from './AddressMapping'
import {
  CellError,
  CellValue,
  ErrorType,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {CellAddress} from './CellAddress'
import {Config} from './Config'
import {Graph} from './Graph'
import {CsvSheets, GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {Interpreter} from './interpreter/Interpreter'
import {Ast, cellAddressFromString, isFormula} from './parser'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {Statistics, StatType} from './statistics/Statistics'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'
import {Evaluator} from './Evaluator'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {ParallelEvaluator} from './ParallelEvaluator'
import {EvaluatorPolicy} from './EvaluatorPolicy'

export {
  Config,
}

/**
 * Engine for one sheet
 */
export class HandsOnEngine {
  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public static async buildFromCsv(csv: string, config: Config = new Config()): Promise<HandsOnEngine> {
    return await HandsOnEngine.buildFromArray(parse(csv, { delimiter: config.csvDelimiter }), config)
  }

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public static async buildFromCsvSheets(csvSheets: CsvSheets, config: Config = new Config()): Promise<HandsOnEngine> {
    const sheets: Sheets = {}
    for (const key of Object.keys(csvSheets)) {
      sheets[key] = parse(csvSheets[key], { delimiter: config.csvDelimiter })
    }
    return await HandsOnEngine.buildFromSheets(sheets, config)
  }

  /**
   * Builds engine for sheet from two-dimmensional array representation
   *
   * @param sheet - two-dimmensional array representation of sheet
   */
  public static async buildFromArray(sheet: Sheet, config: Config = new Config()): Promise<HandsOnEngine> {
    const engine = new HandsOnEngine(config)
    await engine.buildFromSheets({ Sheet1: sheet })
    return engine
  }

  public static async buildFromSheets(sheets: Sheets, config: Config = new Config()): Promise<HandsOnEngine> {
    const engine = new HandsOnEngine(config)
    await engine.buildFromSheets(sheets)
    return engine
  }

  /** Address mapping from addresses to vertices from graph. */
  private addressMapping?: AddressMapping

  /** Range mapping from ranges to vertices representing these ranges. */
  private readonly rangeMapping: RangeMapping = new RangeMapping()

  /** Directed graph of cell dependencies. */
  private readonly graph: Graph<Vertex> = new Graph()

  /** Formula evaluator */
  private evaluator?: Evaluator

  /** Statistics module for benchmarking */
  private readonly stats: Statistics = new Statistics()

  private readonly sheetMapping = new SheetMapping()

  constructor(
    private readonly config: Config
  ) {
  }

  public async buildFromSheets(sheets: Sheets) {
    this.stats.reset()
    this.stats.start(StatType.OVERALL)

    this.addressMapping = AddressMapping.build(this.config.addressMappingFillThreshold)
    for (const sheetName in sheets) {
      const sheetId = this.sheetMapping.addSheet(sheetName)
      this.addressMapping!.autoAddSheet(sheetId, sheets[sheetName])
    }

    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping!, this.rangeMapping, this.stats, this.config, this.sheetMapping)

    let independentSheets: boolean[]
    this.stats.measure(StatType.GRAPH_BUILD, () => {
      independentSheets = graphBuilder.buildGraph(sheets)
    })

    const evaluatorPolicy = new EvaluatorPolicy(this.config)
    if (evaluatorPolicy.shouldBeParallel(independentSheets!)) {
      this.evaluator = new ParallelEvaluator(this.addressMapping!, this.rangeMapping, this.graph, this.config, this.stats, independentSheets)
    } else {
      this.evaluator = new SingleThreadEvaluator(this.addressMapping!, this.rangeMapping, this.graph, this.config, this.stats)
    }

    this.stats.start(StatType.EVALUATION)
    await this.evaluator!.run()
    this.stats.end(StatType.EVALUATION)

    this.stats.end(StatType.OVERALL)
  }

  /**
   * Returns value of the cell with the given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   */
  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(this.sheetMapping, stringAddress, CellAddress.absolute(0, 0, 0))
    return this.addressMapping!.getCellValue(address)
  }

  /**
   * Returns array with values of all cells
   * */
  public getValues(sheet: number) {
    const sheetHeight = this.addressMapping!.getHeight(sheet)
    const sheetWidth = this.addressMapping!.getWidth(sheet)

    const arr: Sheet = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        if (this.addressMapping!.isEmpty(address)) {
          arr[i][j] = ''
          continue
        }

        const cellValue = this.addressMapping!.getCellValue(address)

        if (cellValue instanceof CellError) {
          arr[i][j] = `#${cellValue.type}!`
        } else {
          arr[i][j] = cellValue.toString()
        }
      }
    }

    return arr
  }

  /**
   * Creates CSV string out of sheet content
   */
  public exportAsCsv(sheetName: string): string {
    const sheet = this.sheetMapping.fetch(sheetName)
    return stringify(this.getValues(sheet), { delimiter: ','})
  }

  public exportMultipleSheets(): CsvSheets {
    const sheets: CsvSheets = {}
    for (const sheetName of this.sheetMapping.names()) {
      const sheet = this.sheetMapping.fetch(sheetName)
      sheets[sheetName] = stringify(this.getValues(sheet), { delimiter: ','})
    }
    return sheets
  }

  /**
   * Returns snapshot of a computation time statistics
   */
  public getStats() {
    return this.stats.snapshot()
  }

  /**
   * Sets content of a cell with given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   * @param newCellContent - new cell content
   */
  public async setCellContent(address: SimpleCellAddress, newCellContent: string) {
    const vertex = this.addressMapping!.getCell(address)!
    if (vertex instanceof ValueCellVertex && !isFormula(newCellContent)) {
      if (!isNaN(Number(newCellContent))) {
        vertex.setCellValue(Number(newCellContent))
      } else {
        vertex.setCellValue(newCellContent)
      }
    } else {
      throw Error('Changes to cells other than simple values not supported')
    }

    await this.evaluator!.run()
  }
}
