import {AddressMapping} from './AddressMapping'
import {
  CellError,
  CellValue,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {CellAddress} from './parser/CellAddress'
import {AstNodeType, Ast} from './parser/Ast'
import {Config} from './Config'
import {Evaluator} from './Evaluator'
import {Graph} from './Graph'
import {buildMatrixVertex, GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {cellAddressFromString, isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {SingleThreadEvaluator} from './SingleThreadEvaluator'
import {Statistics, StatType} from './statistics/Statistics'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex, Vertex} from './Vertex'
import {checkMatrixSize} from "./Matrix";
import {AbsoluteCellRange} from "./AbsoluteCellRange";

export {
  Config,
  Sheets,
}

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
  public readonly rangeMapping: RangeMapping = new RangeMapping()

  /** Directed graph of cell dependencies. */
  public readonly graph: Graph<Vertex> = new Graph<Vertex>()

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

    if (!(vertex instanceof MatrixVertex) && isMatrix(newCellContent)) {
      const matrixFormula = newCellContent.substr(1, newCellContent.length - 2)
      const parseResult = this.parser.parse(matrixFormula, address)

      const { vertex: newVertex, size } = buildMatrixVertex(parseResult.ast as ProcedureAst, address)

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

      const { dependencies } = this.parser.getAbsolutizedParserResult(parseResult.hash, address)
      this.graphBuilder!.processCellDependencies(dependencies, newVertex)
    } else if (vertex instanceof FormulaCellVertex) {
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
    } else if (vertex === null) {
      if (isFormula(newCellContent)) {
        const { ast, hash } = this.parser.parse(newCellContent, address)
        const { dependencies } = this.parser.getAbsolutizedParserResult(hash, address)
        const newVertex = new FormulaCellVertex(ast, address)
        this.graph.addNode(newVertex)
        this.addressMapping!.setCell(address, newVertex)
        this.graphBuilder!.processCellDependencies(dependencies, newVertex)
      } else if (newCellContent === '') {
        /* do nothing */
      } else if (!isNaN(Number(newCellContent))) {
        const newVertex = new ValueCellVertex(Number(newCellContent))
        this.graph.addNode(newVertex)
        this.addressMapping!.setCell(address, newVertex)
      } else {
        const newVertex = new ValueCellVertex(newCellContent)
        this.graph.addNode(newVertex)
        this.addressMapping!.setCell(address, newVertex)
      }
    } else if (vertex instanceof EmptyCellVertex) {
      if (isFormula(newCellContent)) {
        const { ast, hash } = this.parser.parse(newCellContent, address)
        const { dependencies } = this.parser.getAbsolutizedParserResult(hash, address)
        const newVertex = new FormulaCellVertex(ast, address)
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
        this.graphBuilder!.processCellDependencies(dependencies, newVertex)
      } else if (newCellContent === '') {
        /* nothing happens */
      } else if (!isNaN(Number(newCellContent))) {
        const newVertex = new ValueCellVertex(Number(newCellContent))
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
      } else {
        const newVertex = new ValueCellVertex(newCellContent)
        this.graph.exchangeNode(vertex, newVertex)
        this.addressMapping!.setCell(address, newVertex)
      }
    } else {
      throw new Error("Illegal operation")
    }

    this.evaluator!.run()
  }

  public addRow(sheet: number, row: number, numberOfRows: number = 1) {
    this.addressMapping!.addRows(sheet, row, numberOfRows)

    if (this.addressMapping!.isThereSomeMatrixAtRow(sheet, row)) {
      throw Error("It is not possible to add row in row with matrix")
    }

    for (const node of this.graph.nodes) {
      if (node instanceof FormulaCellVertex && node.getAddress().sheet === sheet) {
        const newAst = this.fixDependencies(node.getFormula(), node.getAddress(), sheet, row, numberOfRows)
        node.setFormula(newAst)
        this.fixFormulaVertexAddress(node, row, numberOfRows)
      }
    }
    this.rangeMapping.shiftRanges(sheet, row, numberOfRows)
    this.evaluator!.run()
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

  private fixRowDependency(dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress, sheetInWhichWeAddRows: number, row: number, numberOfRows: number): CellAddress | false {
    const isLocalDependency = (dependencyAddress.sheet === formulaAddress.sheet)
    if (isLocalDependency && formulaAddress.sheet !== sheetInWhichWeAddRows) {
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
      if (dependencyAddress.row < row) {
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

  private fixDependencies(ast: Ast, address: SimpleCellAddress, sheet: number, row: number, numberOfRows: number): Ast {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const newCellAddress = this.fixRowDependency(ast.reference, address, sheet, row, numberOfRows)
        if (newCellAddress) {
          return { ...ast, reference: newCellAddress }
        } else {
          return ast
        }
      }
      case AstNodeType.CELL_RANGE: {
        const newStart = this.fixRowDependency(ast.start, address, sheet, row, numberOfRows)
        const newEnd = this.fixRowDependency(ast.end, address, sheet, row, numberOfRows)
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
      case AstNodeType.CONCATENATE_OP:
      case AstNodeType.EQUALS_OP:
      case AstNodeType.NOT_EQUAL_OP:
      case AstNodeType.GREATER_THAN_OP:
      case AstNodeType.LESS_THAN_OP:
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
      case AstNodeType.LESS_THAN_OR_EQUAL_OP:
      case AstNodeType.PLUS_OP:
      case AstNodeType.MINUS_OP:
      case AstNodeType.TIMES_OP:
      case AstNodeType.DIV_OP:
      case AstNodeType.POWER_OP: {
        return {
          type: ast.type,
          left: this.fixDependencies(ast.left, address, sheet, row, numberOfRows),
          right: this.fixDependencies(ast.right, address, sheet, row, numberOfRows),
        } as Ast
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return {
          type: ast.type,
          value: this.fixDependencies(ast.value, address, sheet, row, numberOfRows),
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return {
          type: ast.type,
          procedureName: ast.procedureName,
          args: ast.args.map((arg) => this.fixDependencies(arg, address, sheet, row, numberOfRows))
        }
      }
    }
  }
}
