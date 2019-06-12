import {AbsoluteCellRange} from './AbsoluteCellRange'
import {AddressMapping} from './AddressMapping'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
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
  Vertex,
} from './Vertex'

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = string[][]

export type Dependencies = Map<Vertex, CellDependency[]>

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

  private buildStrategy: GraphBuilderStrategy

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
    this.parser = new ParserWithCaching(config, this.sheetMapping.fetch)

    if (this.config.matrixDetection) {
      this.buildStrategy = new MatrixDetectionStrategy(this.graph, this.addressMapping, this.sheetMapping, this.parser, this.stats, config.matrixDetectionThreshold)
    } else {
      this.buildStrategy = new SimpleStrategy(this.graph, this.addressMapping, this.sheetMapping, this.parser, this.stats)
    }
  }

  /**
   * Builds graph.
   *
   * @param sheet - two-dimensional array representation of sheet
   */
  public buildGraph(sheets: Sheets): boolean[] {
    const independentSheets: boolean[] = []
    for (const sheetName in sheets) {
      independentSheets[this.sheetMapping.fetch(sheetName)] = false
    }

    const dependencies = this.buildStrategy.run(sheets)
    this.processDependencies(dependencies)

    return independentSheets
  }

  private processDependencies(dependencies: Dependencies) {
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

          const matrix = this.addressMapping.getMatrix(restRange)
          if (matrix !== undefined) {
            this.graph.addEdge(matrix, rangeVertex!)
          } else {
            for (const cellFromRange of restRange.generateCellsFromRangeGenerator()) {
              this.graph.addEdge(this.addressMapping.getCell(cellFromRange), rangeVertex!)
            }
          }
          this.graph.addEdge(rangeVertex, endVertex)
        } else {
          this.graph.addEdge(this.addressMapping.getCell(absStartCell), endVertex)
        }
      })
    })
  }
}

export interface GraphBuilderStrategy {
  run(sheets: Sheets): Dependencies
}

export class SimpleStrategy implements GraphBuilderStrategy {
  constructor(
      private readonly graph: Graph<Vertex>,
      private readonly addressMapping: AddressMapping,
      private readonly sheetMapping: SheetMapping,
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics
  ) {
  }

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    this.graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const sheetName in sheets) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      const sheet = sheets[sheetName] as Sheet

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
            vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress)
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
            this.graph.addNode(vertex)
            handleMatrix(vertex, cellAddress, this.addressMapping)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
            vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
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
    }


    return dependencies
  }
}

export class MatrixDetectionStrategy implements GraphBuilderStrategy {
  constructor(
      private readonly graph: Graph<Vertex>,
      private readonly addressMapping: AddressMapping,
      private readonly sheetMapping: SheetMapping,
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics,
      private readonly threshold: number
  ) {}

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.graph, this.addressMapping, dependencies, this.threshold)

    this.graph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const sheetName in sheets) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      const sheet = sheets[sheetName] as Sheet

      matrixHeuristic.addSheet(sheetId, {
        width: this.addressMapping.getWidth(sheetId),
        height: this.addressMapping.getHeight(sheetId),
      })

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const cellAddress = simpleCellAddress(sheetId, j, i)

          if (isMatrix(cellContent)) {
            if (this.addressMapping.has(cellAddress)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, cellAddress))
            const vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress)
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
            this.graph.addNode(vertex)
            handleMatrix(vertex, cellAddress, this.addressMapping)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
            matrixHeuristic.add(parseResult.hash, cellAddress)
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            matrixHeuristic.add('#', cellAddress)
          } else {
            const vertex = new ValueCellVertex(cellContent)
            this.graph.addNode(vertex)
            this.addressMapping.setCell(cellAddress, vertex)
          }
        }
      }
    }

    this.stats.start(StatType.MATRIX_DETECTION)

    const notMatrices = matrixHeuristic.run(sheets, this.sheetMapping, this.parser.getCache())
    for (let i = notMatrices.length - 1; i >= 0; --i) {
      const elem = notMatrices[i]
      if (elem.hash === '#') {
        for (let address of elem.cells.reverse()) {
          const value = sheets[this.sheetMapping.name(address.sheet)][address.row][address.col]
          const vertex = new ValueCellVertex(Number(value))
          this.graph.addNode(vertex)
          this.addressMapping.setCell(address, vertex)
        }
      } else {
        for (let address of elem.cells.reverse()) {
          const parserResult = this.parser.getAbsolutizedParserResult(elem.hash, address)
          const vertex = new FormulaCellVertex(parserResult.ast, address)
          this.graph.addNode(vertex)
          this.addressMapping.setCell(address, vertex)
          dependencies.set(vertex, parserResult.dependencies)
        }
      }
    }

    this.stats.end(StatType.MATRIX_DETECTION)

    return dependencies
  }
}

export function handleMatrix(vertex: CellVertex, formulaAddress: SimpleCellAddress, addressMapping: AddressMapping) {
  addressMapping.setCell(formulaAddress, vertex)

  if (!(vertex instanceof MatrixVertex)) {
    return
  }

  const range = AbsoluteCellRange.spanFrom(formulaAddress, vertex.width, vertex.height)
  addressMapping.setMatrix(range, vertex)

  for (let i = 0; i < vertex.width; ++i) {
    for (let j = 0; j < vertex.height; ++j) {
      const address = simpleCellAddress(formulaAddress.sheet, formulaAddress.col + i, formulaAddress.row + j)
      addressMapping.setCell(address, vertex)
    }
  }
}

export function buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellVertex {
  const size = checkMatrixSize(ast, formulaAddress)
  if (!size) {
    return new ValueCellVertex(new CellError(ErrorType.VALUE))
  }
  return new MatrixVertex(formulaAddress, size.width, size.height, ast)
}
