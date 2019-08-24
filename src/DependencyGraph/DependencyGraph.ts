import assert from 'assert'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {filterWith, map} from '../generatorUtils'
import {findSmallerRange} from '../interpreter/plugin/SumprodPlugin'
import {Ast, AstNodeType} from '../parser'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex, Vertex} from './'
import {AddressMapping} from './AddressMapping'
import {Graph, TopSortResult} from './Graph'
import {MatrixMapping} from './MatrixMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {Statistics, StatType} from '../statistics/Statistics'
import {Config} from '../Config'
import {GetDependenciesQuery} from './GetDependenciesQuery'
import {LazilyTransformingAstService} from "../LazilyTransformingAstService";
import {ColumnsSpan} from '../ColumnsSpan'

export class DependencyGraph {
  /*
   * Invariants:
   * - empty cell has associated EmptyCellVertex if and only if it is a dependency (possibly indirect, through range) to some formula
   */

  public static buildEmpty(lazilyTransformingAstService: LazilyTransformingAstService, config: Config, stats: Statistics) {
    const addressMapping = AddressMapping.build(config.addressMappingFillThreshold)
    const rangeMapping = new RangeMapping()
    return new DependencyGraph(
      addressMapping,
      rangeMapping,
      new Graph<Vertex>(new GetDependenciesQuery(rangeMapping, addressMapping, lazilyTransformingAstService)),
      new SheetMapping(),
      new MatrixMapping(),
      stats,
      lazilyTransformingAstService
    )
  }

  constructor(
      public readonly addressMapping: AddressMapping,
      public readonly rangeMapping: RangeMapping,
      public readonly graph: Graph<Vertex>,
      public readonly sheetMapping: SheetMapping,
      public readonly matrixMapping: MatrixMapping,
      private readonly stats: Statistics = new Statistics(),
      public readonly lazilyTransformingAstService: LazilyTransformingAstService
  ) {}

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[], hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean) {
    const vertex = this.addressMapping.getCell(address)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    const newVertex = new FormulaCellVertex(ast, address, this.lazilyTransformingAstService.version())
    this.graph.exchangeOrAddNode(vertex, newVertex)
    this.addressMapping.setCell(address, newVertex)

    this.processCellDependencies(dependencies, newVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    if (hasVolatileFunction) {
      this.markAsVolatile(newVertex)
    }
    if (hasStructuralChangeFunction) {
      this.markAsDependentOnStructureChange(newVertex)
    }
  }

  public setValueToCell(address: SimpleCellAddress, newValue: number | string) {
    const vertex = this.addressMapping.getCell(address)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (vertex instanceof ValueCellVertex) {
      const oldValue = vertex.getCellValue()
      if (oldValue !== newValue) {
        vertex.setCellValue(newValue)
        this.graph.markNodeAsSpecialRecentlyChanged(vertex)
      }
    } else {
      const newVertex = new ValueCellVertex(newValue)
      this.graph.exchangeOrAddNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    }
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const vertex = this.addressMapping.getCell(address)
    if (vertex === null) {
      return
    }
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (this.graph.adjacentNodes(vertex).size > 0) {
      const emptyVertex = new EmptyCellVertex()
      this.graph.exchangeNode(vertex, emptyVertex)
      this.graph.markNodeAsSpecialRecentlyChanged(emptyVertex)
      this.addressMapping.setCell(address, emptyVertex)
    } else {
      this.graph.removeNode(vertex)
      this.addressMapping.removeCell(address)
    }
  }

  public ensureThatVertexIsNonMatrixCellVertex(vertex: CellVertex | null) {
    assert.ok(!(vertex instanceof MatrixVertex), `Illegal operation`)
  }

  public clearRecentlyChangedVertices() {
    this.graph.clearSpecialNodesRecentlyChanged()
  }

  public verticesToRecompute() {
    return new Set([...this.graph.specialNodesRecentlyChanged, ...this.volatileVertices()])
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
          for (const cellFromRange of restRange.addresses()) {
            this.graph.addEdge(this.fetchOrCreateEmptyCell(cellFromRange), rangeVertex)
          }
        }
        this.graph.addEdge(rangeVertex, endVertex)
      } else {
        this.graph.addEdge(this.fetchOrCreateEmptyCell(absStartCell), endVertex)
      }
    })
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
    const numberOfRows = rowEnd - rowStart + 1

    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      const removedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, 0, rowStart), this.addressMapping.getWidth(sheet), numberOfRows)
      for (const vertex of this.addressMapping.verticesFromRange(removedRange)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
        }
        if (vertex instanceof MatrixVertex) {
          continue
        }
        this.graph.removeNode(vertex)
      }
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.truncateMatricesAfterRemovingRows(sheet, rowStart, rowEnd)
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeRows(sheet, rowStart, rowEnd)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.truncateRangesAfterRemovingRows(sheet, rowStart, rowEnd)
    })

    this.addStructuralNodesToChangeSet()
  }

  public removeColumns(columnsSpan: ColumnsSpan) {
    if (this.matrixMapping.isFormulaMatrixInColumns(columnsSpan)) {
      throw Error('It is not possible to remove column within matrix')
    }

    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      const removedRange = columnsSpan.rangeFromTopTo(this.addressMapping.getHeight(columnsSpan.sheet))
      for (const vertex of this.addressMapping.verticesFromRange(removedRange)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
        }
        if (vertex instanceof MatrixVertex) {
          continue
        }
        this.graph.removeNode(vertex)
      }
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.truncateMatricesAfterRemovingColumns(columnsSpan)
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeColumns(columnsSpan.sheet, columnsSpan.columnStart, columnsSpan.columnEnd)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.truncateRangesAfterRemovingColumns(columnsSpan)
    })

    this.addStructuralNodesToChangeSet()
  }

  public addRows(sheet: number, rowStart: number, numberOfRows: number) {
    if (this.matrixMapping.isFormulaMatrixInRows(sheet, rowStart)) {
      throw Error('It is not possible to add row in row with matrix')
    }

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addRows(sheet, rowStart, numberOfRows)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.expandMatricesAfterAddingRows(sheet, rowStart, numberOfRows)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.fixRanges(sheet, rowStart, numberOfRows)

      this.rangeMapping.moveAllRangesInSheetAfterRowByRows(sheet, rowStart, numberOfRows)
    })

    for (const vertex of this.addressMapping.verticesFromRow(sheet, rowStart)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()
  }

  public addColumns(sheet: number, col: number, numberOfCols: number) {
    if (this.matrixMapping.isFormulaMatrixInColumns(new ColumnsSpan(sheet, col, col))) {
      throw Error('It is not possible to add column in column with matrix')
    }

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addColumns(sheet, col, numberOfCols)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.expandMatricesAfterAddingColumns(sheet, col, numberOfCols)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.fixRangesWhenAddingColumns(sheet, col, numberOfCols)

      this.rangeMapping.moveAllRangesInSheetAfterColumnByColumns(sheet, col, numberOfCols)
    })

    for (const vertex of this.addressMapping.verticesFromColumn(sheet, col)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()
  }

  private addStructuralNodesToChangeSet() {
    for (const vertex of this.graph.specialNodesStructuralChanges) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }
  }

  public ensureNoMatrixInRange(range: AbsoluteCellRange) {
    if (this.matrixMapping.isMatrixInRange(range)) {
      throw Error('It is not possible to move / replace cells with matrix')
    }
  }

  public moveCells(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    for (const sourceAddress of sourceRange.addressesWithDirection(toRight, toBottom)) {
      const targetAddress = simpleCellAddress(toSheet, sourceAddress.col + toRight, sourceAddress.row + toBottom)
      let sourceVertex = this.addressMapping.getCell(sourceAddress)
      const targetVertex = this.addressMapping.getCell(targetAddress)

      this.addressMapping.removeCell(sourceAddress)

      if (sourceVertex !== null) {
        this.graph.markNodeAsSpecialRecentlyChanged(sourceVertex)
        this.addressMapping.setCell(targetAddress, sourceVertex)
        let emptyVertex = null
        for (const adjacentNode of this.graph.adjacentNodes(sourceVertex)) {
          if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
            emptyVertex = emptyVertex || this.fetchOrCreateEmptyCell(sourceAddress)
            this.graph.addEdge(emptyVertex, adjacentNode)
            this.graph.removeEdge(sourceVertex, adjacentNode)
          }
        }
        if (emptyVertex) {
          this.graph.markNodeAsSpecialRecentlyChanged(emptyVertex)
          this.addressMapping.setCell(sourceAddress, emptyVertex)
        }
      }

      if (targetVertex !== null) {
        if (sourceVertex === null) {
          this.addressMapping.removeCell(targetAddress)
        }
        for (const adjacentNode of this.graph.adjacentNodes(targetVertex)) {
          sourceVertex = sourceVertex || this.fetchOrCreateEmptyCell(targetAddress)
          this.graph.addEdge(sourceVertex, adjacentNode)
          this.graph.markNodeAsSpecialRecentlyChanged(sourceVertex)
        }
        this.graph.removeNode(targetVertex)
      }
    }

    for (const rangeVertex of this.rangeMapping.rangeVerticesContainedInRange(sourceRange)) {
      for (const adjacentNode of this.graph.adjacentNodes(rangeVertex)) {
        if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
          this.graph.removeEdge(rangeVertex, adjacentNode)

          for (const address of rangeVertex.range.addresses()) {
            const newEmptyVertex = this.fetchOrCreateEmptyCell(address)
            this.graph.addEdge(newEmptyVertex, adjacentNode)
            this.addressMapping.setCell(address, newEmptyVertex)
            this.graph.markNodeAsSpecialRecentlyChanged(newEmptyVertex)
          }
        }
      }
    }

    this.rangeMapping.moveRangesInsideSourceRange(sourceRange, toRight, toBottom, toSheet)
  }

  public disableNumericMatrices() {
    for (const [key, matrixVertex] of this.matrixMapping.numericMatrices()) {
      const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
      // 1. split matrix to chunks, add value cell vertices
      // 2. update address mapping for each address in matrix
      for (const address of matrixRange.addresses()) {
        const value = this.getCellValue(address) as number // We wouldn't need that typecast if we would take values from Matrix
        const valueVertex = new ValueCellVertex(value)
        this.addVertex(address, valueVertex)
      }

      for (const adjacentNode of this.graph.adjacentNodes(matrixVertex).values()) {
        // 3. update dependencies for each range that has this matrix in dependencies
        if (adjacentNode instanceof RangeVertex) {
          for (const address of adjacentNode.range.addresses()) {
            const vertex = this.fetchCell(address)
            this.graph.addEdge(vertex, adjacentNode)
          }
          // 4. fix edges for cell references in formulas
        } else if (adjacentNode instanceof FormulaCellVertex) {
          const relevantReferences = this.cellReferencesInRange(adjacentNode.getFormula(this.lazilyTransformingAstService), adjacentNode.getAddress(this.lazilyTransformingAstService), matrixRange)
          for (const vertex of relevantReferences) {
            this.graph.addEdge(vertex, adjacentNode)
          }
        }
      }

      // 4. remove old matrix
      this.graph.removeNode(matrixVertex)
      this.matrixMapping.removeMatrix(key)
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
    for (const vertex of this.addressMapping.verticesFromRange(range)) {
      if (vertex instanceof MatrixVertex) {
        throw Error('You cannot modify only part of an array')
      }
    }

    this.setMatrix(range, matrixVertex)

    for (const [address, vertex] of this.addressMapping.entriesFromRange(range)) {
      if (vertex) {
        this.graph.exchangeNode(vertex, matrixVertex)
      }
      this.setVertexAddress(address, matrixVertex)
    }
  }

  public nodes(): IterableIterator<Vertex> {
    return this.graph.nodes.values()
  }

  public* formulaNodesFromSheet(sheet: number): IterableIterator<FormulaCellVertex> {
    for (const vertex of this.graph.nodes) {
      if (vertex instanceof FormulaCellVertex && vertex.address.sheet === sheet) {
        yield vertex
      }
    }
  }

  public* matrixFormulaNodesFromSheet(sheet: number): IterableIterator<MatrixVertex> {
    for (const vertex of this.graph.nodes) {
      if (vertex instanceof MatrixVertex && vertex.sheet === sheet && vertex.isFormula()) {
        yield vertex
      }
    }
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

  public getTopologicallySortedSubgraphFrom(vertices: Vertex[], operatingFunction: (node: Vertex) => boolean): Vertex[] {
    return this.graph.getTopologicallySortedSubgraphFrom(vertices, operatingFunction)
  }

  public markAsVolatile(vertex: Vertex) {
    this.graph.markNodeAsSpecial(vertex)
  }

  public markAsDependentOnStructureChange(vertex: Vertex) {
    this.graph.markNodeAsChangingWithStructure(vertex)
  }

  public* formulaVerticesInRange(range: AbsoluteCellRange): IterableIterator<FormulaCellVertex> {
    const vertices = map((address) => {
      return this.addressMapping.getCell(address)
    }, range.addresses())

    yield* filterWith((vertex) => {
      return vertex !== null && vertex instanceof FormulaCellVertex
    }, vertices) as IterableIterator<FormulaCellVertex>
  }

  public volatileVertices() {
    return this.graph.specialNodes
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
    for (const rangeVertex of this.rangeMapping.rangesInSheet(sheet)) {
      if (rangeVertex.range.includesRow(row)) {
        const anyVertexInRow = this.addressMapping.getCell(simpleCellAddress(sheet, rangeVertex.start.col, row + numberOfRows))!
        if (this.graph.existsEdge(anyVertexInRow, rangeVertex)) {
          const addedSubrangeInThatRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, rangeVertex.start.col, row), rangeVertex.range.width(), numberOfRows)
          for (const address of addedSubrangeInThatRange.addresses()) {
            this.graph.addEdge(this.fetchOrCreateEmptyCell(address), rangeVertex)
          }
        }
      }
    }
  }

  private fixRangesWhenAddingColumns(sheet: number, column: number, numberOfColumns: number): void {
    for (const rangeVertex of this.rangeMapping.rangesInSheet(sheet)) {
      if (rangeVertex.range.includesColumn(column)) {
        const anyVertexInColumn = this.addressMapping.fetchCell(simpleCellAddress(sheet, column + numberOfColumns, rangeVertex.start.row))
        if (this.graph.existsEdge(anyVertexInColumn, rangeVertex)) {
          const addedSubrangeInThatRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, column, rangeVertex.start.row), numberOfColumns, rangeVertex.range.height())
          for (const address of addedSubrangeInThatRange.addresses()) {
            this.graph.addEdge(this.fetchOrCreateEmptyCell(address), rangeVertex)
          }
        }
      }
    }
  }

  private setAddressMappingForMatrixVertex(vertex: CellVertex, formulaAddress: SimpleCellAddress): void {
    this.setVertexAddress(formulaAddress, vertex)

    if (!(vertex instanceof MatrixVertex)) {
      return
    }

    const range = AbsoluteCellRange.spanFrom(formulaAddress, vertex.width, vertex.height)
    this.setMatrix(range, vertex)

    for (const address of range.addresses()) {
      this.setVertexAddress(address, vertex)
    }
  }

  private truncateMatricesAfterRemovingRows(sheet: number, rowStart: number, rowEnd: number) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByRows(sheet, rowStart, rowEnd)
    verticesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateRangesAfterRemovingRows(sheet: number, rowStart: number, rowEnd: number) {
    const rangesToRemove = this.rangeMapping.truncateRangesByRows(sheet, rowStart, rowEnd)
    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateMatricesAfterRemovingColumns(columnsSpan: ColumnsSpan) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByColumns(columnsSpan)
    verticesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateRangesAfterRemovingColumns(columnsSpan: ColumnsSpan) {
    const rangesToRemove = this.rangeMapping.truncateRangesByColumns(columnsSpan)
    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private expandMatricesAfterAddingRows(sheet: number, rowStart: number, numberOfRows: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInRows(sheet, rowStart)) {
      matrix.addRows(sheet, rowStart, numberOfRows)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, matrix.getAddress().col, rowStart), matrix.width, numberOfRows)
      for (const address of addedRange.addresses()) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }

  private expandMatricesAfterAddingColumns(sheet: number, columnStart: number, numberOfColumns: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInColumns(sheet, columnStart)) {
      matrix.addColumns(sheet, columnStart, numberOfColumns)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, columnStart, matrix.getAddress().row), numberOfColumns, matrix.height)
      for (const address of addedRange.addresses()) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }
}
