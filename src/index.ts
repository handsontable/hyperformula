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
import {Pool} from './worker/Pool'

export {
  Config,
}

interface Evaluator {
  run(): void,
}

class SingleThreadEvaluator implements Evaluator {
  /** Topologically sorted list of vertices. */
  private sortedVertices: Vertex[] = []

  /** List of vertices which are on some cycle */
  private verticesOnCycle: Vertex[] = []

  private interpreter: Interpreter

  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.interpreter = new Interpreter(this.addressMapping, this.rangeMapping, this.graph, this.config)
  }

  public async run() {
    this.stats.measure(StatType.TOP_SORT, () => {
      ({ sorted: this.sortedVertices, cycled: this.verticesOnCycle } = this.graph.topologicalSort())
    })

    this.recomputeFormulas()
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas() {
    this.verticesOnCycle.forEach((vertex: Vertex) => {
      (vertex as FormulaCellVertex).setCellValue(new CellError(ErrorType.CYCLE))
    })
    this.sortedVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula() as Ast
        const cellValue = this.interpreter.evaluateAst(formula, address)
        vertex.setCellValue(cellValue)
      } else if (vertex instanceof RangeVertex) {
        vertex.clear()
      }
    })
  }
}

class ParallelEvaluator implements Evaluator {
  /** Topologically sorted list of vertices. */
  private sortedVertices: Vertex[] = []

  /** List of vertices which are on some cycle */
  private verticesOnCycle: Vertex[] = []

  private interpreter: Interpreter

  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly config: Config,
    private readonly stats: Statistics,
    private readonly independentSheets: boolean[],
  ) {
    this.interpreter = new Interpreter(this.addressMapping, this.rangeMapping, this.graph, this.config)
  }

  public async run() {
    const chunks = this.prepareChunks()
    const chunksPromises: Promise<any>[] = []
    const chunksPromisesResolvers: (() => void)[] = []
    for (const chunk of chunks) {
      const promise = new Promise((resolve) => {
        chunksPromisesResolvers.push(resolve)
      })
      chunksPromises.push(promise)
    }

    const pool = new Pool(chunks.length)
    pool.init()
    pool.addWorkerTaskForAllWorkers((workerId: number) => ({
      data: { kind: "INIT", ...chunks[workerId] },
      callback: (message: any) => {
        this.handleWorkerMessage(message.data as { address: SimpleCellAddress, result:CellValue }[])
        chunksPromisesResolvers[workerId]()
      }
    }))

    await Promise.all(chunksPromises)
  }

  private handleWorkerMessage(messageData: { address: SimpleCellAddress, result:CellValue }[]) {
    for (const result of messageData) {
      const vertex = this.addressMapping.getCell(result.address)
      if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
        vertex.setCellValue(result.result)
      }
    }
  }

  private prepareChunks() {
    const chunks = []
    const dependentVertices: { vertices: Vertex[], edges: number[], mappings: { sheetId: number, serializedMapping: SerializedMapping }[] } = {
      vertices: [],
      edges: [],
      mappings: [],
    }
    for (let sheetId = 0; sheetId < this.independentSheets.length; sheetId++) {
      let vertices = this.addressMapping.getAllVerticesFromSheet(sheetId).concat(this.rangeMapping.getAllVertices())
      const edges = []
      const serializedMapping = this.addressMapping.getSerializedMapping(sheetId)
      for (const node of vertices) {
        for (const adjacentNode of this.graph.adjacentNodes(node)) {
          edges.push(node.id)
          edges.push(adjacentNode.id)
        }
      }
      if (this.independentSheets[sheetId] === true) {
        const chunk = {
          vertices, 
          edges,
          mappings: [{ sheetId, serializedMapping }],
        }
        chunks.push(chunk)
      } else if (this.independentSheets[sheetId] === false) {
        dependentVertices.vertices = dependentVertices.vertices.concat(vertices)
        dependentVertices.edges = dependentVertices.edges.concat(edges)
        dependentVertices.mappings.push({ sheetId, serializedMapping })
      }
    }
    if (dependentVertices.mappings.length > 0) {
      chunks.unshift(dependentVertices)
    }
    return chunks
  }
}

class EvaluatorPolicy {
  constructor(private readonly config: Config) {
  }

  public shouldBeParallel(independentSheets: boolean[]): boolean {
    return false
    for (const sheetIndependence of independentSheets) {
      if (sheetIndependence)
        return true
    }
    return false
  }
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
