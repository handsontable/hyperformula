import {AbsoluteCellRange} from './AbsoluteCellRange'
import {AddressMapping} from './AddressMapping'
import {cellError, ErrorType, simpleCellAddress, SimpleCellAddress,} from './Cell'
import {CellDependency} from './CellDependency'
import {Config} from './Config'
import {Graph} from './Graph'
import {GraphBuilderMatrixHeuristic} from './GraphBuilderMatrixHeuristic'
import {findSmallerRange} from './interpreter/plugin/SumprodPlugin'
import {checkMatrixSize} from './Matrix'
import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {Statistics, StatType} from './statistics/Statistics'
import {
  CellVertex,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex
} from './Vertex'

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = string[][]

export interface Sheets {
  [sheetName: string]: Sheet
}

export interface CsvSheets {
  [sheetName: string]: string
}

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
              private readonly addressMapping: AddressMapping,
              private readonly rangeMapping: RangeMapping,
              private readonly stats: Statistics,
              private readonly config: Config,
              private readonly sheetMapping: SheetMapping) {
    this.parser = new ParserWithCaching(config, this.sheetMapping)
  }

  /**
   * Builds graph.
   *
   * @param sheet - two-dimensional array representation of sheet
   */
  public buildGraph(sheets: Sheets) {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const independentSheets: boolean[] = []
    for (const sheetName in sheets) {
      independentSheets[this.sheetMapping.fetch(sheetName)] = true
    }

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.graph, this.addressMapping, dependencies, this.config)

    this.graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const sheetName in sheets) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      const sheet = sheets[sheetName] as Sheet
      matrixHeuristic.addSheet(sheetId, { width: sheet[0].length, height: sheet.length })

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const cellAddress = simpleCellAddress(sheetId, j, i)
          let vertex = null

          if (isMatrix(cellContent)) {
            if (this.addressMapping.has(cellAddress)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, cellAddress))
            matrixHeuristic.add(parseResult.hash, cellAddress)
            vertex = this.buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress)
            dependencies.set(vertex, parseResult.dependencies)
            this.checkDependencies(sheetId, parseResult.dependencies, independentSheets)
            this.graph.addNode(vertex)
            this.handleMatrix(vertex, cellAddress)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
            vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
            matrixHeuristic.add(parseResult.hash, cellAddress)
            dependencies.set(vertex, parseResult.dependencies)
            this.graph.addNode(vertex)
            this.addressMapping.setCell(cellAddress, vertex)
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            vertex = new ValueCellVertex(Number(cellContent))
            matrixHeuristic.add("#d", cellAddress)
            this.graph.addNode(vertex)
            this.addressMapping.setCell(cellAddress, vertex)
          } else {
            vertex = new ValueCellVertex(cellContent)
            this.graph.addNode(vertex)
            this.addressMapping.setCell(cellAddress, vertex)
          }
        }
      }
    }

    matrixHeuristic.run()
    this.handleDependencies(dependencies)
  }

  private checkDependencies(sheetId: number, dependencies: CellDependency[], independentSheets: boolean[]) {
    for (const dependency of dependencies) {
      if (dependency.sheet !== sheetId) {
        independentSheets[dependency.sheet] = false
        independentSheets[sheetId] = false
      }
    }
  }

  private buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellVertex {
    const size = checkMatrixSize(ast, formulaAddress)

    if (!size) {
      return new ValueCellVertex(cellError(ErrorType.VALUE))
    }

    return new MatrixVertex(formulaAddress, size.width, size.height, ast)
  }

  private handleMatrix(vertex: CellVertex, formulaAddress: SimpleCellAddress) {
    this.addressMapping.setCell(formulaAddress, vertex)

    if (!(vertex instanceof MatrixVertex)) {
      return
    }

    for (let i = 0; i < vertex.width; ++i) {
      for (let j = 0; j < vertex.height; ++j) {
        const address = simpleCellAddress(formulaAddress.sheet, formulaAddress.col + i, formulaAddress.row + j)
        this.addressMapping.setCell(address, vertex)
      }
    }
  }

  private handleDependencies(dependencies: Map<Vertex, CellDependency[]>) {
    dependencies.forEach((cellDependencies: CellDependency[], endVertex: Vertex) => {
      cellDependencies.forEach((absStartCell: CellDependency) => {
        if (absStartCell instanceof AbsoluteCellRange) {
          const range = absStartCell
          let rangeVertex = this.rangeMapping.getRange(range.start, range.end)
          if (rangeVertex === null) {
            rangeVertex = new RangeVertex(range)
            this.rangeMapping.setRange(rangeVertex)
          }

          this.graph.addNode(rangeVertex)

          const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, [range])
          const restRange = restRanges[0]
          if (smallerRangeVertex) {
            this.graph.addEdge(smallerRangeVertex, rangeVertex)
          }
          for (const cellFromRange of restRange.generateCellsFromRangeGenerator()) {
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
