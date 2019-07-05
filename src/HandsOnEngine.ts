import {CellError, CellValue, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellAddress} from './parser/CellAddress'
import {
  Ast,
  AstNodeType,
  buildCellErrorAst,
  cellAddressFromString,
  isFormula,
  isMatrix,
  ParserWithCaching,
  ProcedureAst
} from './parser'
import {Config} from './Config'
import {Evaluator} from './Evaluator'
import {buildMatrixVertex, GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'
import {
  AddressMapping,
  CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  Graph,
  MatrixVertex,
  RangeMapping,
  RangeVertex,
  SheetMapping,
  ValueCellVertex,
  Vertex
} from './DependencyGraph'
import {AbsoluteCellRange} from "./AbsoluteCellRange";

/**
 * Engine for one sheet
 */
export class HandsOnEngine {
  /**
   * Builds engine for sheet from two-dimmensional array representation
   *
   * @param sheet - two-dimmensional array representation of sheet
   */
  public static buildFromArray(sheet: Sheet, config: Config = new Config()): HandsOnEngine {
    const engine = new HandsOnEngine(config)
    engine.buildFromSheets({Sheet1: sheet})
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
  public readonly rangeMapping: RangeMapping = new RangeMapping()

  /** Directed graph of cell dependencies. */
  public readonly graph: Graph<Vertex> = new Graph<Vertex>()

  public dependencyGraph?: DependencyGraph

  /** Formula evaluator */
  private evaluator?: Evaluator

  private parser: ParserWithCaching

  private graphBuilder?: GraphBuilder

  /** Statistics module for benchmarking */
  public readonly stats: Statistics = new Statistics()

  public readonly sheetMapping = new SheetMapping()


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
    this.dependencyGraph = new DependencyGraph(this.addressMapping, this.rangeMapping, this.graph, this.sheetMapping)

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
    const vertex = this.addressMapping!.getCell(address)
    let verticesToRecomputeFrom: Vertex[] = vertex ? [vertex] : []

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !isNaN(Number(newCellContent))) {
      vertex.setMatrixCellValue(address, Number(newCellContent))
    } else if (!(vertex instanceof MatrixVertex) && isMatrix(newCellContent)) {
      const matrixFormula = newCellContent.substr(1, newCellContent.length - 2)
      const parseResult = this.parser.parse(matrixFormula, address)

      const {vertex: newVertex, size} = buildMatrixVertex(parseResult.ast as ProcedureAst, address)

      if (!size || !(newVertex instanceof MatrixVertex)) {
        throw Error("What if new matrix vertex is not properly constructed?")
      }

      const range = AbsoluteCellRange.spanFrom(address, size.width, size.height)
      for (const x of range.generateCellsFromRangeGenerator()) {
        if (this.addressMapping!.getCell(x) instanceof MatrixVertex) {
          throw Error("You cannot modify only part of an array")
        }
      }

      this.addressMapping!.setMatrix(range, newVertex)

      for (const x of range.generateCellsFromRangeGenerator()) {
        const vertex = this.addressMapping!.getCell(x)
        if (vertex) {
          this.graph.exchangeNode(vertex, newVertex)
        }
        this.addressMapping!.setCell(x, newVertex)
      }

      const {dependencies} = this.parser.getAbsolutizedParserResult(parseResult.hash, address)
      this.dependencyGraph!.processCellDependencies(dependencies, newVertex)
      verticesToRecomputeFrom = [newVertex]
    } else if (vertex instanceof FormulaCellVertex || vertex instanceof ValueCellVertex || vertex instanceof EmptyCellVertex || vertex === null) {
      if (isFormula(newCellContent)) {
        const {ast, hash} = this.parser.parse(newCellContent, address)
        const {dependencies} = this.parser.getAbsolutizedParserResult(hash, address)
        this.dependencyGraph!.setFormulaToCell(address, ast, dependencies)
      } else if (newCellContent === '') {
        this.dependencyGraph!.setCellEmpty(address)
      } else if (!isNaN(Number(newCellContent))) {
        this.dependencyGraph!.setValueToCell(address, Number(newCellContent))
      } else {
        this.dependencyGraph!.setValueToCell(address, newCellContent)
      }
      verticesToRecomputeFrom = Array.from(this.dependencyGraph!.recentlyChangedVertices)
      this.dependencyGraph!.clearRecentlyChangedVertices()
    } else {
      throw new Error("Illegal operation")
    }

    if (verticesToRecomputeFrom) {
      this.evaluator!.partialRun(verticesToRecomputeFrom)
    }
  }

  public addRows(sheet: number, row: number, numberOfRowsToAdd: number = 1) {
    if (this.addressMapping!.isFormulaMatrixInRows(sheet, row)) {
      throw Error("It is not possible to add row in row with matrix")
    }

    this.addressMapping!.addRows(sheet, row, numberOfRowsToAdd)

    for (let matrix of this.addressMapping!.numericMatricesAtRow(sheet, row)) {
      matrix.addRows(sheet, row, numberOfRowsToAdd)
    }

    for (const node of this.graph.nodes) {
      if (node instanceof FormulaCellVertex && node.getAddress().sheet === sheet) {
        const newAst = transformAddressesInFormula(
          node.getFormula(), node.getAddress(),
          fixRowDependency(sheet, row, numberOfRowsToAdd)
        )
        const cachedAst = this.parser.rememberNewAst(newAst)
        node.setFormula(cachedAst)
        this.fixFormulaVertexAddress(node, row, numberOfRowsToAdd)
      }
    }

    this.fixRanges(sheet, row, numberOfRowsToAdd)

    this.evaluator!.run()
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
    // 1. check if there is formula matrix
    if (this.addressMapping!.isFormulaMatrixInRows(sheet, rowStart, rowEnd)) {
      throw Error("It is not possible to remove row with matrix")
    }
    const numberOfRowsToDelete = rowEnd - rowStart + 1

    this.addressMapping!.removeRows(sheet, rowStart, numberOfRowsToDelete)

    // 2. Fix dependencies
    for (const node of this.graph.nodes) {
      if (node instanceof FormulaCellVertex && node.getAddress().sheet === sheet) {
        const newAst = transformAddressesInFormula(
          node.getFormula(),
          node.getAddress(),
          fixRowDependencyRowsDeletion(sheet, rowStart, numberOfRowsToDelete)
        )
        const cachedAst = this.parser.rememberNewAst(newAst)
        node.setFormula(cachedAst)
        this.fixFormulaVertexAddress(node, rowStart, -numberOfRowsToDelete)
      }
    }
  }

  public addColumns(sheet: number, col: number, numberOfCols: number = 1) {
    if (this.addressMapping!.isFormulaMatrixInColumns(sheet, col)) {
      throw Error("It is not possible to add column in column with matrix")
    }
  }

  public disableNumericMatrices() {
    for (const [key, matrixVertex] of this.addressMapping!.numericMatrices()) {
      const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
      // 1. split matrix to chunks, add value cell vertices
      // 2. update address mapping for each address in matrix
      for (const address of matrixRange.generateCellsFromRangeGenerator()) {
        const value = this.addressMapping!.getCellValue(address)
        const valueVertex = new ValueCellVertex(value)
        this.graph.addNode(valueVertex)
        this.addressMapping!.setCell(address, valueVertex)
      }

      for (const adjacentNode of this.graph.adjacentNodes(matrixVertex).values()) {
        // 3. update dependencies for each range that has this matrix in dependencies
        if (adjacentNode instanceof RangeVertex) {
          for (const address of adjacentNode.range.generateCellsFromRangeGenerator()) {
            const vertex = this.addressMapping!.fetchCell(address)
            this.graph.addEdge(vertex, adjacentNode)
          }
          // 4. fix edges for cell references in formulas
        } else if (adjacentNode instanceof FormulaCellVertex) {
          const relevantReferences = this.cellReferencesInRange(adjacentNode.getFormula(), adjacentNode.getAddress(), matrixRange)
          for (const vertex of relevantReferences) {
            this.graph.addEdge(vertex, adjacentNode)
          }
        }
      }

      // 4. remove old matrix
      this.graph.removeNode(matrixVertex)
      this.addressMapping!.removeMatrix(key)
    }
  }

  private cellReferencesInRange(ast: Ast, baseAddress: SimpleCellAddress, range: AbsoluteCellRange): Array<CellVertex> {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const dependencyAddress = ast.reference.toSimpleCellAddress(baseAddress)
        if (range.addressInRange(dependencyAddress)) {
          return [this.addressMapping!.fetchCell(dependencyAddress)]
        }
        return []
      }
      case AstNodeType.CELL_RANGE:
      case AstNodeType.ERROR:
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return []
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return this.cellReferencesInRange(ast.value, baseAddress, range)
      }
      case AstNodeType.FUNCTION_CALL: {
        return ast.args.map((arg) => this.cellReferencesInRange(arg, baseAddress, range)).reduce((a, b) => a.concat(b), [])
      }
      default: {
        return [...this.cellReferencesInRange(ast.left, baseAddress, range), ...this.cellReferencesInRange(ast.right, baseAddress, range)]
      }
    }
  }

  private fixFormulaVertexAddress(node: FormulaCellVertex, row: number, numberOfRows: number) {
    const nodeAddress = node.getAddress()
    if (row <= nodeAddress.row) {
      node.setAddress({
        ...nodeAddress,
        row: nodeAddress.row + numberOfRows
      })
    }
  }

  private fixRanges(sheet: number, row: number, numberOfRows: number) {
    for (const range of this.rangeMapping.getValues()) {
      if (range.sheet === sheet && range.start.row < row && range.end.row >= row) {
        const anyVertexInRow = this.addressMapping!.getCell(simpleCellAddress(sheet, range.start.col, row + numberOfRows))!
        if (this.graph.adjacentNodes(anyVertexInRow).has(range)) {
          for (let y = row; y < row + numberOfRows; ++y) {
            for (let x = range.start.col; x <= range.end.col; ++x) {
              this.graph.addEdge(this.dependencyGraph!.fetchOrCreateEmptyCell(simpleCellAddress(sheet, x, y)), range)
            }
          }
        }
      }
    }

    this.rangeMapping.shiftRanges(sheet, row, numberOfRows)
  }
}

export type TransformCellAddressFunction = (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => CellAddress | CellError | false

export function fixRowDependencyRowsDeletion(sheetInWhichWeRemoveRows: number, topRow: number, numberOfRows: number): TransformCellAddressFunction {
  return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
    if ((dependencyAddress.sheet === formulaAddress.sheet)
        && (formulaAddress.sheet !== sheetInWhichWeRemoveRows)) {
      return false
    }

    if (dependencyAddress.isRowAbsolute()) {
      if (sheetInWhichWeRemoveRows !== dependencyAddress.sheet) {
        return false
      }

      if (dependencyAddress.row < topRow) { // Aa
        return false
      } else if (dependencyAddress.row >= topRow + numberOfRows) { // Ab
        return dependencyAddress.shiftedByRows(-numberOfRows)
      }
    } else {
      const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
      if (absolutizedDependencyAddress.row < topRow) {
        if (formulaAddress.row < topRow) {  // Raa
          return false
        } else if (formulaAddress.row >= topRow + numberOfRows) { // Rab
          return dependencyAddress.shiftedByRows(numberOfRows)
        }
      } else if (absolutizedDependencyAddress.row >= topRow + numberOfRows) {
        if (formulaAddress.row < topRow) {  // Rba
          return dependencyAddress.shiftedByRows(-numberOfRows)
        } else if (formulaAddress.row >= topRow + numberOfRows) { // Rbb
          return false
        }
      }
    }

    return new CellError(ErrorType.REF)
  }
}


export function fixRowDependency(sheetInWhichWeAddRows: number, row: number, numberOfRows: number): TransformCellAddressFunction {
  return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
    if ((dependencyAddress.sheet === formulaAddress.sheet)
      && (formulaAddress.sheet !== sheetInWhichWeAddRows)) {
      return false
    }

    if (dependencyAddress.isRowAbsolute()) {
      if (sheetInWhichWeAddRows !== dependencyAddress.sheet) {
        return false
      }

      if (dependencyAddress.row < row) { // Case Aa
        return false
      } else { // Case Ab
        return dependencyAddress.shiftedByRows(numberOfRows)
      }
    } else {
      const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
      if (absolutizedDependencyAddress.row < row) {
        if (formulaAddress.row < row) { // Case Raa
          return false
        } else { // Case Rab
          return dependencyAddress.shiftedByRows(-numberOfRows)
        }
      } else {
        if (formulaAddress.row < row) { // Case Rba
          return dependencyAddress.shiftedByRows(numberOfRows)
        } else { // Case Rbb
          return false
        }
      }
    }
  }
}


export function transformAddressesInFormula(ast: Ast, address: SimpleCellAddress, transformCellAddressFn: TransformCellAddressFunction): Ast {
  switch (ast.type) {
    case AstNodeType.CELL_REFERENCE: {
      const newCellAddress = transformCellAddressFn(ast.reference, address)
      if (newCellAddress && newCellAddress instanceof CellAddress) {
        return {...ast, reference: newCellAddress}
      } else if (newCellAddress instanceof CellError) {
        return buildCellErrorAst(newCellAddress)
      } else {
        return ast
      }
    }
    case AstNodeType.CELL_RANGE: {
      const newStart = transformCellAddressFn(ast.start, address)
      const newEnd = transformCellAddressFn(ast.end, address)
      if (newStart instanceof CellError) {
        return buildCellErrorAst(newStart)
      }
      if (newEnd instanceof CellError) {
        return buildCellErrorAst(newEnd)
      }
      if (newStart || newEnd) {
        return {
          ...ast,
          start: newStart || ast.start,
          end: newEnd || ast.end,
        }
      } else {
        return ast
      }
    }
    case AstNodeType.ERROR:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING: {
      return ast
    }
    case AstNodeType.MINUS_UNARY_OP: {
      return {
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn),
      }
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => transformAddressesInFormula(arg, address, transformCellAddressFn))
      }
    }
    default: {
      return {
        type: ast.type,
        left: transformAddressesInFormula(ast.left, address, transformCellAddressFn),
        right: transformAddressesInFormula(ast.right, address, transformCellAddressFn),
      } as Ast
    }
  }
}
