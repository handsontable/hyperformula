import parse from 'csv-parse/lib/sync'
import stringify from 'csv-stringify/lib/sync'
import {AddressMapping} from './AddressMapping'
import {ArrayAddressMapping} from './ArrayAddressMapping'
import {
  absoluteCellAddress,
  cellAddressFromString,
  CellError,
  cellError,
  CellValue,
  ErrorType,
  isCellError,
  simpleCellAddress,
} from './Cell'
import {Config} from './Config'
import {Graph} from './Graph'
import {GraphBuilder, Sheet} from './GraphBuilder'
import {IAddressMapping} from './IAddressMapping'
import {Interpreter} from './interpreter/Interpreter'
import {isFormula} from './parser/ParserWithCaching'
import {RangeMapping} from './RangeMapping'
import {Statistics, StatType} from './statistics/Statistics'
import {EmptyCellVertex, FormulaCellVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'
import {InterpretingBundle} from "../wasminterpreter/pkg/interpreter";

/**
 * Engine for one sheet
 */
export class HandsOnEngine {
  public static useWasm = false;

  /**
   * Builds engine for sheet from CSV string representation
   *
   * @param csv - csv representation of sheet
   */
  // public static buildFromCsv(csv: string, config: Config = new Config()): HandsOnEngine {
  //   return HandsOnEngine.buildFromArray(parse(csv, { delimiter: config.csvDelimiter }), config)
  // }

  /**
   * Builds engine for sheet from two-dimmensional array representation
   *
   * @param sheet - two-dimmensional array representation of sheet
   */
  public static buildFromArray(wasminterpreter: typeof import("../wasminterpreter/pkg/interpreter"), sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    return new HandsOnEngine(wasminterpreter, sheet, config)
  }

  /** Address mapping from addresses to vertices from graph. */
  private readonly addressMapping: IAddressMapping

  /** Range mapping from ranges to vertices representing these ranges. */
  private readonly rangeMapping: RangeMapping = new RangeMapping()

  /** Directed graph of cell dependencies. */
  private readonly graph: Graph<Vertex> = new Graph()

  /** Topologically sorted list of vertices. */
  private sortedVertices: Vertex[] = []

  /** List of vertices which are on some cycle */
  private verticesOnCycle: Vertex[] = []

  /** Formula interpreter */
  private readonly interpreter: Interpreter

  /** Statistics module for benchmarking */
  public readonly stats: Statistics = new Statistics()

  /** Engine configuration */
  private readonly config: Config

  private wasminterpreter: typeof import("../wasminterpreter/pkg/interpreter")
  private bundle?: InterpretingBundle;

  constructor(wasminterpreter: typeof import("../wasminterpreter/pkg/interpreter"), sheet: Sheet, config: Config) {
    this.config = config
    this.wasminterpreter = wasminterpreter

    this.stats.reset()
    this.stats.start(StatType.OVERALL)

    // this.addressMapping = buildAddressMapping(sheet, config.addressMappingFillThreshold)
    const {height, width, fill} = findBoundaries(sheet)
    this.addressMapping = new ArrayAddressMapping(width, height)
    if (HandsOnEngine.useWasm) {
      this.bundle = this.wasminterpreter.build_interpreting_bundle(height, width)
    }

    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping, this.rangeMapping, this.stats, this.config, this.bundle)
    this.interpreter = new Interpreter(this.addressMapping, this.rangeMapping, this.graph, this.config)

    this.stats.measure(StatType.GRAPH_BUILD, () => {
      graphBuilder.buildGraph(sheet)
    })

    this.stats.measure(StatType.TOP_SORT, () => {
      if (this.bundle) {
        this.bundle.compute_topological_sorting();
      } else {
        ({ sorted: this.sortedVertices, cycled: this.verticesOnCycle } = this.graph.topologicalSort())
      }
    })

    this.stats.measure(StatType.EVALUATION, () => {
      if (this.bundle) {
        this.bundle.compute_formulas();
      } else {
        this.recomputeFormulas()
      }
    })

    this.stats.end(StatType.OVERALL)
  }

  /**
   * Returns value of the cell with the given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   */
  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping.getCell(address)!
      return vertex.getCellValue()
  }

  /**
   * Creates CSV string out of sheet content
   */
  public exportAsCsv(): string {
    const sheetHeight = this.addressMapping.getHeight()
    const sheetWidth = this.addressMapping.getWidth()

    const arr: Sheet = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const cell = this.addressMapping.getCell(simpleCellAddress(j, i))

        if (cell == null || cell === EmptyCellVertex.getSingletonInstance()) {
          arr[i][j] = ''
          continue
        }

        const cellValue = cell.getCellValue()

        if (isCellError(cellValue)) {
          arr[i][j] = `#${(cellValue as CellError).type}!`
        } else {
          arr[i][j] = cellValue.toString()
        }
      }
    }

    return stringify(arr, { delimiter: ','})
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
  public setCellContent(stringAddress: string, newCellContent: string) {
    const address = cellAddressFromString(stringAddress, absoluteCellAddress(0, 0))
    const vertex = this.addressMapping.getCell(address)!
      if (vertex instanceof ValueCellVertex && !isFormula(newCellContent)) {
        if (!isNaN(Number(newCellContent))) {
          vertex.setCellValue(Number(newCellContent))
        } else {
          vertex.setCellValue(newCellContent)
        }
      } else {
        throw Error('Changes to cells other than simple values not supported')
      }

    this.recomputeFormulas()
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas() {
    this.verticesOnCycle.forEach((vertex: Vertex) => {
      (vertex as FormulaCellVertex).setCellValue(cellError(ErrorType.CYCLE))
    })
    this.sortedVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula()
        const cellValue = this.interpreter.evaluateAst(formula, address)
        vertex.setCellValue(cellValue)
      } else if (vertex instanceof RangeVertex) {
        vertex.clear()
      }
    })
  }
}

/**
 * Returns actual width, height and fill ratio of a sheet
 *
 * @param sheet - two-dimmensional array sheet representation
 */
export function findBoundaries(sheet: Sheet): ({ width: number, height: number, fill: number }) {
  let maxWidth = 0
  let cellsCount = 0
  for (let currentRow = 0; currentRow < sheet.length; currentRow++) {
    const currentRowWidth = sheet[currentRow].length
    if (maxWidth === undefined || maxWidth < currentRowWidth) {
      maxWidth = currentRowWidth
    }
    for (let currentCol = 0; currentCol < currentRowWidth; currentCol++) {
      const currentValue = sheet[currentRow][currentCol]
      if (currentValue !== '') {
        cellsCount++
      }
    }
  }
  const sheetSize = sheet.length * maxWidth

  return {
    height: sheet.length,
    width: maxWidth,
    fill: sheetSize === 0 ? 0 : cellsCount / sheetSize,
  }
}

/**
 * Creates right address mapping implementation based on fill ratio of a sheet
 *
 * @param sheet - two-dimmensional array sheet representation
 */
export function buildAddressMapping(sheet: Sheet, threshold: number): IAddressMapping {
  const {height, width, fill} = findBoundaries(sheet)
  if (fill > threshold) {
    return new ArrayAddressMapping(width, height)
  } else {
    return new AddressMapping()
  }
}

