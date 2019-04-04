import {
  CellDependency,
  cellError,
  ErrorType,
  simpleCellAddress,
  SimpleCellAddress,
  SimpleCellRange,
  simpleCellRange,
} from './Cell'
import {Config} from './Config'
import {Graph} from './Graph'
import {IAddressMapping} from './IAddressMapping'
import {findSmallerRange} from './interpreter/plugin/SumprodPlugin'
import {ProcedureAst} from './parser/Ast'
import {isFormula, isMatrix, ParserWithCaching} from './parser/ParserWithCaching'
import {RangeMapping} from './RangeMapping'
import {Statistics, StatType} from './statistics/Statistics'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, Matrix, RangeVertex, ValueCellVertex, Vertex,} from './Vertex'
import {checkMatrixSize} from "./Matrix";

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = string[][]

/**
 * Service building the graph and mappings.
 */
export class GraphBuilder {
  /**
   * Parser to use when reading formulas.
   */
  private parser: ParserWithCaching

  /**
   * Configures the building service.
   *
   * @param graph - graph instance in which we want to add vertices and edges
   * @param addressMapping - mapping from addresses to vertices
   * @param rangeMapping - mapping from ranges to range vertices
   * @param stats - dependency tracking building performance
   * @param config - configuration of the sheet
   */
  constructor(private readonly graph: Graph<Vertex>,
              private readonly addressMapping: IAddressMapping,
              private readonly rangeMapping: RangeMapping,
              private readonly stats: Statistics,
              private readonly config: Config) {
    this.parser = new ParserWithCaching(config)
  }

  /**
   * Builds graph.
   *
   * @param sheet - two-dimensional array representation of sheet
   */
  public buildGraph(sheet: Sheet) {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    this.graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (let i = 0; i < sheet.length; ++i) {
      const row = sheet[i]
      for (let j = 0; j < row.length; ++j) {
        const cellContent = row[j]
        const cellAddress = simpleCellAddress(j, i)
        let vertex = null

        if (isMatrix(cellContent)) {
          const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
          vertex = this.buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress)
          dependencies.set(vertex, parseResult.dependencies)
          this.graph.addNode(vertex)
          this.handleMatrix(vertex, cellAddress)
        } else if (isFormula(cellContent)) {
          const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
          vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
          dependencies.set(vertex, parseResult.dependencies)
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        } else if (cellContent === '') {
          /* we don't care about empty cells here */
        } else if (!isNaN(Number(cellContent))) {
          vertex = new ValueCellVertex(Number(cellContent))
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        } else {
          vertex = new ValueCellVertex(cellContent)
          this.graph.addNode(vertex)
          this.addressMapping.setCell(cellAddress, vertex)
        }
      }
    }

    this.handleDependencies(dependencies)
  }

  private buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellVertex {
    const size = checkMatrixSize(ast, formulaAddress)

    if (!size) {
      return new ValueCellVertex(cellError(ErrorType.VALUE))
    }

    return new Matrix(ast, formulaAddress, size.width, size.height)
  }

  private handleMatrix(vertex: CellVertex, formulaAddress: SimpleCellAddress) {
    this.addressMapping.setCell(formulaAddress, vertex)

    if (!(vertex instanceof Matrix)) {
      return
    }

    for (let i = 0; i < vertex.width; ++i) {
      for (let j = 0; j < vertex.height; ++j) {
        const address = simpleCellAddress(formulaAddress.col + j, formulaAddress.row + i)
        this.addressMapping.setCell(address, vertex)
      }
    }
  }

  private handleDependencies(dependencies: Map<Vertex, CellDependency[]>) {
    dependencies.forEach((cellDependencies: CellDependency[], endVertex: Vertex) => {
      cellDependencies.forEach((absStartCell: CellDependency) => {
        if (Array.isArray(absStartCell)) {
          const [rangeStart, rangeEnd] = absStartCell
          let rangeVertex = this.rangeMapping.getRange(rangeStart, rangeEnd)
          if (rangeVertex === null) {
            rangeVertex = new RangeVertex(rangeStart, rangeEnd)
            this.rangeMapping.setRange(rangeVertex)
          }

          this.graph.addNode(rangeVertex)

          const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, [simpleCellRange(rangeStart, rangeEnd)])
          const restRange = restRanges[0]
          if (smallerRangeVertex) {
            this.graph.addEdge(smallerRangeVertex, rangeVertex)
          }
          for (const cellFromRange of generateCellsFromRangeGenerator(restRange)) {
            this.graph.addEdge(this.addressMapping.getCell(cellFromRange), rangeVertex!)
          }
          this.graph.addEdge(rangeVertex, endVertex)
        } else {
          this.graph.addEdge(this.addressMapping.getCell(absStartCell), endVertex)
        }
      })
    })
  }
}

/**
 * Generates cell addresses in given range.
 *
 * @param rangeStart - top-left corner of range
 * @param rangeEnd - bottom-right corner of range
 */
export const generateCellsFromRangeGenerator = function* (simpleCellRange: SimpleCellRange) {
  let currentRow = simpleCellRange.start.row
  while (currentRow <= simpleCellRange.end.row) {
    let currentColumn = simpleCellRange.start.col
    while (currentColumn <= simpleCellRange.end.col) {
      yield simpleCellAddress(currentColumn, currentRow)
      currentColumn++
    }
    currentRow++
  }
}
