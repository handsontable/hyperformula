import parse from 'csv-parse/lib/sync'
import stringify from 'csv-stringify/lib/sync'
import {AddressMapping} from './AddressMapping'
import {
  CellError,
  CellValue,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {CellAddress} from './parser/CellAddress'
import {Config} from './Config'
import {Evaluator} from './Evaluator'
import {Graph} from './Graph'
import {CsvSheets, GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {cellAddressFromString, isFormula, ParserWithCaching} from './parser'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'
import {EmptyCellVertex, FormulaCellVertex, ValueCellVertex, Vertex} from './Vertex'

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
  public static buildFromCsv(csv: string, config: Config = new Config()): HandsOnEngine {
    return HandsOnEngine.buildFromArray(parse(csv, { delimiter: config.csvDelimiter }), config)
  }

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  public static buildFromCsvSheets(csvSheets: CsvSheets, config: Config = new Config()): HandsOnEngine {
    const sheets: Sheets = {}
    for (const key of Object.keys(csvSheets)) {
      sheets[key] = parse(csvSheets[key], { delimiter: config.csvDelimiter })
    }
    return HandsOnEngine.buildFromSheets(sheets, config)
  }

  /**
   * Builds engine for sheet from two-dimmensional array representation
   *
   * @param sheet - two-dimmensional array representation of sheet
   */
  public static buildFromArray(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    engine.buildFromSheets({ Sheet1: sheet })
    return engine
  }

  public static buildFromSheets(sheets: Sheets, config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    engine.buildFromSheets(sheets)
    return engine
  }

  /** Address mapping from addresses to vertices from graph. */
  public addressMapping?: AddressMapping

  /** Range mapping from ranges to vertices representing these ranges. */
  private readonly rangeMapping: RangeMapping = new RangeMapping()

  /** Directed graph of cell dependencies. */
  public readonly graph: Graph<Vertex> = new Graph<Vertex>()

  /** Formula evaluator */
  private evaluator?: Evaluator

  private parser: ParserWithCaching

  private graphBuilder?: GraphBuilder

  /** Statistics module for benchmarking */
  public readonly stats: Statistics = new Statistics()

  private readonly sheetMapping = new SheetMapping()


  constructor(
    private readonly config: Config,
  ) {
    this.parser = new ParserWithCaching(this.config, this.sheetMapping.fetch)
  }

  public buildFromSheets(sheets: Sheets) {
    this.stats.reset()
    this.stats.start(StatType.OVERALL)

    this.addressMapping = AddressMapping.build(this.config.addressMappingFillThreshold)
    for (const sheetName in sheets) {
      const sheetId = this.sheetMapping.addSheet(sheetName)
      this.addressMapping!.autoAddSheet(sheetId, sheets[sheetName])
    }

    this.graphBuilder = new GraphBuilder(this.graph, this.addressMapping!, this.rangeMapping, this.stats, this.config, this.sheetMapping, this.parser)

    this.stats.measure(StatType.GRAPH_BUILD, () => {
      this.graphBuilder!.buildGraph(sheets)
    })

    this.evaluator = new SingleThreadEvaluator(this.addressMapping!, this.rangeMapping, this.graph, this.config, this.stats)

    this.evaluator!.run()

    this.stats.end(StatType.OVERALL)
  }

  /**
   * Returns value of the cell with the given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   */
  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(this.sheetMapping.fetch, stringAddress, CellAddress.absolute(0, 0, 0))
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

  public getSheetsDimensions(): Map<string, { width: number, height: number }> {
    const sheetDimensions = new Map<string, { width: number, height: number }>()
    for (const sheetName of this.sheetMapping.names()) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      sheetDimensions.set(sheetName, {
        width: this.addressMapping!.getWidth(sheetId),
        height: this.addressMapping!.getHeight(sheetId),
      })
    }
    return sheetDimensions
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
  public setCellContent(address: SimpleCellAddress, newCellContent: string) {
    const vertex = this.addressMapping!.getCell(address)!

    if (vertex instanceof FormulaCellVertex) {
      this.graph.removeIncomingEdges(vertex)
      if (isFormula(newCellContent)) {
        const { ast, hash } = this.parser.parse(newCellContent, address)
        const { dependencies } = this.parser.getAbsolutizedParserResult(hash, address)
        vertex.setFormula(ast)
        this.graphBuilder!.processCellDependencies(dependencies, vertex)
      } else if (newCellContent === '') {
        this.graph.exchangeNode(vertex, EmptyCellVertex.getSingletonInstance())
        this.addressMapping!.removeCell(address)
      } else if (!isNaN(Number(newCellContent))) {
        const newVertex = new ValueCellVertex(Number(newCellContent))
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
      } else {
        const newVertex = new ValueCellVertex(newCellContent)
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
      }
    } else if (vertex instanceof ValueCellVertex) {
      if (isFormula(newCellContent)) {
        const { ast, hash } = this.parser.parse(newCellContent, address)
        const { dependencies } = this.parser.getAbsolutizedParserResult(hash, address)
        const newVertex = new FormulaCellVertex(ast, address)
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
        this.graphBuilder!.processCellDependencies(dependencies, newVertex)
      } else if (newCellContent === '') {
        this.graph.exchangeNode(vertex, EmptyCellVertex.getSingletonInstance())
        this.addressMapping!.removeCell(address)
      } else if (!isNaN(Number(newCellContent))) {
        vertex.setCellValue(Number(newCellContent))
      } else {
        vertex.setCellValue(newCellContent)
      }
    } else if (vertex instanceof EmptyCellVertex) {
      if (isFormula(newCellContent)) {
        throw new Error("Not implemented yet")
      } else if (newCellContent === '') {
        /* nothing happens */
      } else if (!isNaN(Number(newCellContent))) {
        throw new Error("Not implemented yet")
      } else {
        throw new Error("Not implemented yet")
      }
    }

    this.evaluator!.run()
  }
}
