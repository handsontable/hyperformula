import assert from 'assert'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {findSmallerRange} from '../interpreter/plugin/SumprodPlugin'
import {absolutizeDependencies, Ast, AstNodeType, CellAddress, collectDependencies} from '../parser'
import {AddressMapping} from './AddressMapping'
import {Graph, TopSortResult} from './Graph'
import {MatrixMapping} from './MatrixMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {
  CellVertex,
  RangeVertex,
  Vertex,
} from './Vertex'
import { MatrixVertex, FormulaCellVertex, EmptyCellVertex, ValueCellVertex } from './'

export class DependencyGraph {
  public recentlyChangedVertices: Set<Vertex> = new Set()

  constructor(
      private readonly addressMapping: AddressMapping,
      private readonly rangeMapping: RangeMapping,
      private readonly graph: Graph<Vertex>,
      private readonly sheetMapping: SheetMapping,
      private readonly matrixMapping: MatrixMapping,
  ) {
    this.graph.addNode(EmptyCellVertex.getSingletonInstance())
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[]) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof FormulaCellVertex) {
      vertex.setFormula(ast)
      this.processCellDependencies(dependencies, vertex)
      this.recentlyChangedVertices.add(vertex)
    } else {
      const newVertex = new FormulaCellVertex(ast, address)
      this.graph.exchangeOrAddNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.processCellDependencies(dependencies, newVertex)
      this.recentlyChangedVertices.add(newVertex)
    }
  }

  public setValueToCell(address: SimpleCellAddress, newValue: number | string) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof ValueCellVertex) {
      vertex.setCellValue(newValue)
      this.recentlyChangedVertices.add(vertex)
    } else {
      const newVertex = new ValueCellVertex(newValue)
      this.graph.exchangeOrAddNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.recentlyChangedVertices.add(newVertex)
    }
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const vertex = this.addressMapping.getCell(address)
    this.removeIncomingEdgesIfFormulaVertex(vertex)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof FormulaCellVertex || vertex instanceof ValueCellVertex) {
      this.graph.exchangeNode(vertex, EmptyCellVertex.getSingletonInstance())
      this.addressMapping.removeCell(address)
      this.recentlyChangedVertices.add(EmptyCellVertex.getSingletonInstance())
    }
  }

  public ensureThatVertexIsNonMatrixCellVertex(vertex: CellVertex | null) {
    assert.ok(!(vertex instanceof MatrixVertex), `Illegal operation`)
  }

  public removeIncomingEdgesIfFormulaVertex(vertex: CellVertex | null) {
    if (vertex instanceof FormulaCellVertex) {
      this.removeIncomingEdgesFromFormulaVertex(vertex)
    }
  }

  public clearRecentlyChangedVertices() {
    this.recentlyChangedVertices = new Set()
  }

  public processCellDependencies(cellDependencies: CellDependency[], endVertex: Vertex) {
    cellDependencies.forEach((absStartCell: CellDependency) => {
      if (absStartCell instanceof AbsoluteCellRange) {
        const range = absStartCell
        let rangeVertex = this.rangeMapping.getRange(range.start, range.end)
        if (rangeVertex === null) {
          rangeVertex = new RangeVertex(range)
          this.rangeMapping.setRange(rangeVertex)
        }

        this.graph.addNode(rangeVertex)

        const {smallerRangeVertex, restRanges} = findSmallerRange(this, [range])
        const restRange = restRanges[0]
        if (smallerRangeVertex) {
          this.graph.addEdge(smallerRangeVertex, rangeVertex)
        }

        const matrix = this.matrixMapping.getMatrix(restRange)
        if (matrix !== undefined) {
          this.graph.addEdge(matrix, rangeVertex)
        } else {
          for (const cellFromRange of restRange.generateCellsFromRangeGenerator()) {
            this.graph.addEdge(this.fetchOrCreateEmptyCell(cellFromRange), rangeVertex)
          }
        }
        this.graph.addEdge(rangeVertex, endVertex)
      } else {
        this.graph.addEdge(this.fetchOrCreateEmptyCell(absStartCell), endVertex)
      }
    })
  }

  public removeIncomingEdgesFromFormulaVertex(vertex: FormulaCellVertex) {
    const deps: Array<CellAddress | [CellAddress, CellAddress]> = []
    collectDependencies(vertex.getFormula(), deps)
    const absoluteDeps = absolutizeDependencies(deps, vertex.getAddress())
    const verticesForDeps = new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping!.getRange(dep.start, dep.end)!
      } else {
        return this.addressMapping.fetchCell(dep)
      }
    }))
    this.graph.removeIncomingEdgesFrom(verticesForDeps, vertex)
  }

  public fetchOrCreateEmptyCell(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (!vertex) {
      vertex = new EmptyCellVertex()
      this.graph.addNode(vertex)
      this.addressMapping.setCell(address, vertex)
    }
    return vertex
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number) {
    if (this.matrixMapping.isFormulaMatrixInRows(sheet, rowStart, rowEnd)) {
      throw Error('It is not possible to remove row with matrix')
    }

    for (let x = 0; x < this.addressMapping.getWidth(sheet); ++x) {
      for (let y = rowStart; y <= rowEnd; ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const vertex = this.addressMapping.getCell(address)
        if (vertex instanceof MatrixVertex || vertex === null) {
          continue
        }
        this.graph.removeNode(vertex)
      }
    }

    for (const [key, matrix] of this.matrixMapping.numericMatricesInRows(sheet, rowStart, rowEnd)) {
      matrix.removeRows(sheet, rowStart, rowEnd)
      if (matrix.height === 0) {
        this.graph.removeNode(matrix)
        this.matrixMapping.removeMatrix(key)
      }
    }

    this.addressMapping.removeRows(sheet, rowStart, rowEnd)

    const rangesToRemove = this.rangeMapping.truncateRanges(sheet, rowStart, rowEnd)

    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  public removeColumns(sheet: number, columnStart: number, columnEnd: number) {
    if (this.matrixMapping.isFormulaMatrixInColumns(sheet, columnStart, columnEnd)) {
      throw Error('It is not possible to remove column within matrix')
    }

    for (let y = 0; y < this.addressMapping.getHeight(sheet); ++y) {
      for (let x = columnStart; x <= columnEnd; ++x) {
        const address = simpleCellAddress(sheet, x, y)
        const vertex = this.addressMapping.getCell(address)
        if (vertex instanceof MatrixVertex || vertex === null) {
          continue
        }
        this.graph.removeNode(vertex)
      }
    }

    for (const [key, matrix] of this.matrixMapping.numericMatricesInColumns(sheet, columnStart, columnEnd)) {
      matrix.removeColumns(sheet, columnStart, columnEnd)
      if (matrix.width === 0) {
        this.graph.removeNode(matrix)
        this.matrixMapping.removeMatrix(key)
      }
    }

    this.addressMapping.removeColumns(sheet, columnStart, columnEnd)

    const rangesToRemove = this.rangeMapping.truncateRangesVertically(sheet, columnStart, columnEnd)

    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  public addRows(sheet: number, rowStart: number, numberOfRows: number) {
    if (this.matrixMapping.isFormulaMatrixInRows(sheet, rowStart)) {
      throw Error('It is not possible to add row in row with matrix')
    }

    this.addressMapping.addRows(sheet, rowStart, numberOfRows)

    for (const [, matrix] of this.matrixMapping.numericMatricesInRows(sheet, rowStart)) {
      matrix.addRows(sheet, rowStart, numberOfRows)
      for (let x = rowStart; x < rowStart + numberOfRows; x++) {
        for (let y = matrix.getAddress().col; y < matrix.getAddress().col + matrix.width; y++) {
          this.addressMapping.setCell(simpleCellAddress(sheet, y, x), matrix)
        }
      }
    }

    this.fixRanges(sheet, rowStart, numberOfRows)
  }

  public addColumns(sheet: number, col: number, numberOfCols: number) {
    if (this.matrixMapping.isFormulaMatrixInColumns(sheet, col)) {
      throw Error('It is not possible to add column in column with matrix')
    }

    this.addressMapping.addColumns(sheet, col, numberOfCols)

    for (const [, matrix] of this.matrixMapping!.numericMatricesInColumns(sheet, col)) {
      matrix.addColumns(sheet, col, numberOfCols)
      for (let y = col; y < col + numberOfCols; y++) {
        for (let x = matrix.getAddress().row; x < matrix.getAddress().row + matrix.height; x++) {
          this.addressMapping.setCell(simpleCellAddress(sheet, y, x), matrix)
        }
      }
    }

    this.fixRangesWhenAddingColumns(sheet, col, numberOfCols)
  }

  public disableNumericMatrices() {
    for (const [key, matrixVertex] of this.matrixMapping.numericMatrices()) {
      const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
      // 1. split matrix to chunks, add value cell vertices
      // 2. update address mapping for each address in matrix
      for (const address of matrixRange.generateCellsFromRangeGenerator()) {
        const value = this.getCellValue(address) as number // We wouldn't need that typecast if we would take values from Matrix
        const valueVertex = new ValueCellVertex(value)
        this.addVertex(address, valueVertex)
      }

      for (const adjacentNode of this.graph.adjacentNodes(matrixVertex).values()) {
        // 3. update dependencies for each range that has this matrix in dependencies
        if (adjacentNode instanceof RangeVertex) {
          for (const address of adjacentNode.range.generateCellsFromRangeGenerator()) {
            const vertex = this.fetchCell(address)
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
      this.matrixMapping!.removeMatrix(key)
    }
  }

  public addVertex(address: SimpleCellAddress, vertex: CellVertex): void {
    this.graph.addNode(vertex)
    this.setVertexAddress(address, vertex)
  }

  public addMatrixVertex(address: SimpleCellAddress, vertex: CellVertex): void {
    this.graph.addNode(vertex)
    this.setAddressMappingForMatrixVertex(vertex, address)
  }

  public addNewMatrixVertex(matrixVertex: MatrixVertex): void {
    const range = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
    for (const x of range.generateCellsFromRangeGenerator()) {
      if (this.getCell(x) instanceof MatrixVertex) {
        throw Error('You cannot modify only part of an array')
      }
    }

    this.setMatrix(range, matrixVertex)

    for (const address of range.generateCellsFromRangeGenerator()) {
      const vertex = this.addressMapping.getCell(address)
      if (vertex) {
        this.graph.exchangeNode(vertex, matrixVertex)
      }
      this.setVertexAddress(address, matrixVertex)
    }
  }

  public nodes(): IterableIterator<Vertex> {
    return this.graph.nodes.values()
  }

  public existsVertex(address: SimpleCellAddress): boolean {
    return this.addressMapping.has(address)
  }

  public fetchCell(address: SimpleCellAddress): CellVertex {
    return this.addressMapping.fetchCell(address)
  }

  public getCell(address: SimpleCellAddress): CellVertex | null {
    return this.addressMapping.getCell(address)
  }

  public isEmpty(address: SimpleCellAddress): boolean {
    return this.addressMapping.isEmpty(address)
  }

  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.addressMapping.getCellValue(address)
  }

  public setVertexAddress(address: SimpleCellAddress, vertex: CellVertex) {
    this.addressMapping.setCell(address, vertex)
  }

  public existsEdge(fromNode: Vertex, toNode: Vertex): boolean {
    return this.graph.existsEdge(fromNode, toNode)
  }

  public getSheetId(sheetName: string): number {
    return this.sheetMapping.fetch(sheetName)
  }

  public getSheetName(sheetId: number): string {
    return this.sheetMapping.name(sheetId)
  }

  public getSheetHeight(sheet: number): number {
    return this.addressMapping.getHeight(sheet)
  }

  public getSheetWidth(sheet: number): number {
    return this.addressMapping.getWidth(sheet)
  }

  public getMatrix(range: AbsoluteCellRange): MatrixVertex | undefined {
    return this.matrixMapping.getMatrix(range)
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex): void {
    this.matrixMapping.setMatrix(range, vertex)
  }

  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    return this.rangeMapping.getRange(start, end)
  }

  public topologicalSort(): TopSortResult<Vertex> {
    return this.graph.topologicalSort()
  }

  public getTopologicallySortedSubgraphFrom(vertices: Vertex[]): TopSortResult<Vertex> {
    return this.graph.getTopologicallySortedSubgraphFrom(vertices)
  }

  private cellReferencesInRange(ast: Ast, baseAddress: SimpleCellAddress, range: AbsoluteCellRange): CellVertex[] {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const dependencyAddress = ast.reference.toSimpleCellAddress(baseAddress)
        if (range.addressInRange(dependencyAddress)) {
          return [this.fetchCell(dependencyAddress)]
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

  private fixRanges(sheet: number, row: number, numberOfRows: number): void {
    for (const range of this.rangeMapping.getValues()) {
      if (range.sheet === sheet && range.start.row < row && range.end.row >= row) {
        const anyVertexInRow = this.addressMapping.getCell(simpleCellAddress(sheet, range.start.col, row + numberOfRows))!
        if (this.graph.adjacentNodes(anyVertexInRow).has(range)) {
          for (let y = row; y < row + numberOfRows; ++y) {
            for (let x = range.start.col; x <= range.end.col; ++x) {
              this.graph.addEdge(this.fetchOrCreateEmptyCell(simpleCellAddress(sheet, x, y)), range)
            }
          }
        }
      }
    }

    this.rangeMapping.shiftRanges(sheet, row, numberOfRows)
  }

  private fixRangesWhenAddingColumns(sheet: number, column: number, numberOfColumns: number): void {
    for (const range of this.rangeMapping.getValues()) {
      if (range.sheet === sheet && range.start.col < column && range.end.col >= column) {
        const anyVertexInColumn = this.addressMapping.fetchCell(simpleCellAddress(sheet, column + numberOfColumns, range.start.row))
        if (this.graph.adjacentNodes(anyVertexInColumn).has(range)) {
          for (let y = column; y < column + numberOfColumns; ++y) {
            for (let x = range.start.col; x <= range.end.col; ++x) {
              this.graph.addEdge(this.fetchOrCreateEmptyCell(simpleCellAddress(sheet, y, x)), range)
            }
          }
        }
      }
    }

    this.rangeMapping.shiftRangesColumns(sheet, column, numberOfColumns)
  }

  private setAddressMappingForMatrixVertex(vertex: CellVertex, formulaAddress: SimpleCellAddress): void {
    this.setVertexAddress(formulaAddress, vertex)

    if (!(vertex instanceof MatrixVertex)) {
      return
    }

    const range = AbsoluteCellRange.spanFrom(formulaAddress, vertex.width, vertex.height)
    this.setMatrix(range, vertex)

    for (let i = 0; i < vertex.width; ++i) {
      for (let j = 0; j < vertex.height; ++j) {
        const address = simpleCellAddress(formulaAddress.sheet, formulaAddress.col + i, formulaAddress.row + j)
        this.setVertexAddress(address, vertex)
      }
    }
  }
}
