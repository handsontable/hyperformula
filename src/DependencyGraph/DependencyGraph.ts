import assert from 'assert'
import {AbsoluteCellRange, AbsoluteColumnRange} from '../AbsoluteCellRange'
import {InternalCellValue, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {findSmallerRange} from '../interpreter/plugin/SumprodPlugin'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Maybe} from '../Maybe'
import {Ast} from '../parser'
import {RowsSpan} from '../RowsSpan'
import {Statistics, StatType} from '../statistics/Statistics'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ParsingErrorVertex, RangeVertex, ValueCellVertex, Vertex} from './'
import {AddressMapping} from './AddressMapping/AddressMapping'
import {collectAddressesDependentToMatrix} from './collectAddressesDependentToMatrix'
import {GetDependenciesQuery} from './GetDependenciesQuery'
import {Graph, TopSortResult} from './Graph'
import {MatrixMapping} from './MatrixMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {ValueCellVertexValue} from './ValueCellVertex'

export class DependencyGraph {
  /*
   * Invariants:
   * - empty cell has associated EmptyCellVertex if and only if it is a dependency (possibly indirect, through range) to some formula
   */

  public static buildEmpty(lazilyTransformingAstService: LazilyTransformingAstService, config: Config, stats: Statistics) {
    const addressMapping = new AddressMapping(config.chooseAddressMappingPolicy)
    const rangeMapping = new RangeMapping()
    return new DependencyGraph(
      addressMapping,
      rangeMapping,
      new Graph<Vertex>(new GetDependenciesQuery(rangeMapping, addressMapping, lazilyTransformingAstService, config.functionsWhichDoesNotNeedArgumentsToBeComputed())),
      new SheetMapping(config.language),
      new MatrixMapping(),
      stats,
      lazilyTransformingAstService,
      config.functionsWhichDoesNotNeedArgumentsToBeComputed(),
    )
  }

  constructor(
    public readonly addressMapping: AddressMapping,
    public readonly rangeMapping: RangeMapping,
    public readonly graph: Graph<Vertex>,
    public readonly sheetMapping: SheetMapping,
    public readonly matrixMapping: MatrixMapping,
    public readonly stats: Statistics = new Statistics(),
    public readonly lazilyTransformingAstService: LazilyTransformingAstService,
    public readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>,
  ) {
  }

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

  public setParsingErrorToCell(address: SimpleCellAddress, errorVertex: ParsingErrorVertex) {
    const vertex = this.addressMapping.getCell(address)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)
    this.graph.exchangeOrAddNode(vertex, errorVertex)
    this.addressMapping.setCell(address, errorVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(errorVertex)
  }

  public setValueToCell(address: SimpleCellAddress, newValue: ValueCellVertexValue) {
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
    assert.ok(!(vertex instanceof MatrixVertex), 'Illegal operation')
  }

  public clearRecentlyChangedVertices() {
    this.graph.clearSpecialNodesRecentlyChanged()
  }

  public verticesToRecompute() {
    return new Set([...this.graph.specialNodesRecentlyChanged, ...this.volatileVertices()])
  }

  public processCellDependencies(cellDependencies: CellDependency[], endVertex: Vertex) {
    cellDependencies.forEach((absStartCell: CellDependency) => {
      if (absStartCell instanceof AbsoluteCellRange || absStartCell instanceof AbsoluteColumnRange) {
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

        let matrix
        if (restRange instanceof AbsoluteCellRange) {
          matrix = this.matrixMapping.getMatrix(restRange)
        }
        if (matrix !== undefined) {
          this.graph.addEdge(matrix, rangeVertex)
        } else {
          for (const cellFromRange of restRange.addresses()) {
            this.graph.addEdge(this.fetchCellOrCreateEmpty(cellFromRange), rangeVertex)
          }
        }
        this.graph.addEdge(rangeVertex, endVertex)
      } else {
        this.graph.addEdge(this.fetchCellOrCreateEmpty(absStartCell), endVertex)
      }
    })
  }

  public fetchCellOrCreateEmpty(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (!vertex) {
      vertex = new EmptyCellVertex()
      this.graph.addNode(vertex)
      this.addressMapping.setCell(address, vertex)
    }
    return vertex
  }

  public removeRows(removedRows: RowsSpan) {
    if (this.matrixMapping.isFormulaMatrixInRows(removedRows)) {
      throw Error('It is not possible to remove row with matrix')
    }

    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const vertex of this.addressMapping.verticesFromRowsSpan(removedRows)) {
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
      this.truncateMatricesAfterRemovingRows(removedRows)
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeRows(removedRows)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.truncateRangesAfterRemovingRows(removedRows)
    })

    this.addStructuralNodesToChangeSet()
  }

  public removeSheet(removedSheetId: number) {
    const matrices: Set<MatrixVertex> = new Set()
    for (const [_, vertex] of this.addressMapping.sheetEntries(removedSheetId)) {
      if (vertex instanceof MatrixVertex) {
        if (matrices.has(vertex)) {
          continue
        } else {
          matrices.add(vertex)
        }
      }
      for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
        this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
      }
      this.graph.removeNode(vertex)
    }

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      for (const matrix of matrices.values()) {
        this.matrixMapping.removeMatrix(matrix.getRange())
      }
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeSheet(removedSheetId)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const rangesToRemove = this.rangeMapping.removeRangesInSheet(removedSheetId)
      for (const range of rangesToRemove) {
        this.graph.removeNode(range)
      }
    })

    this.addStructuralNodesToChangeSet()
  }

  public clearSheet(sheetId: number) {
    const matrices: Set<MatrixVertex> = new Set()
    for (const [address, vertex] of this.addressMapping.sheetEntries(sheetId)) {
      if (vertex instanceof MatrixVertex) {
        matrices.add(vertex)
      } else {
        this.setCellEmpty(address)
      }
    }

    for (const matrix of matrices.values()) {
      this.setMatrixEmpty(matrix)
    }

    this.addStructuralNodesToChangeSet()
  }

  public removeColumns(removedColumns: ColumnsSpan) {
    if (this.matrixMapping.isFormulaMatrixInColumns(removedColumns)) {
      throw Error('It is not possible to remove column within matrix')
    }

    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const vertex of this.addressMapping.verticesFromColumnsSpan(removedColumns)) {
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
      this.truncateMatricesAfterRemovingColumns(removedColumns)
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeColumns(removedColumns)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.truncateRangesAfterRemovingColumns(removedColumns)
    })

    this.addStructuralNodesToChangeSet()
  }

  public addRows(addedRows: RowsSpan) {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.expandMatricesAfterAddingRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.fixRanges(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)

      this.rangeMapping.moveAllRangesInSheetAfterRowByRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    for (const vertex of this.addressMapping.verticesFromRowsSpan(addedRows)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()
  }

  public addColumns(addedColumns: ColumnsSpan) {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.expandMatricesAfterAddingColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.fixRangesWhenAddingColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)

      this.rangeMapping.moveAllRangesInSheetAfterColumnByColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    for (const vertex of this.addressMapping.verticesFromColumnsSpan(addedColumns)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()
  }

  public ensureNoMatrixInRange(range: AbsoluteCellRange) {
    if (this.matrixMapping.isFormulaMatrixInRange(range)) {
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
            emptyVertex = emptyVertex || this.fetchCellOrCreateEmpty(sourceAddress)
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
          sourceVertex = sourceVertex || this.fetchCellOrCreateEmpty(targetAddress)
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
            const newEmptyVertex = this.fetchCellOrCreateEmpty(address)
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
    for (const [_, matrixVertex] of this.matrixMapping.numericMatrices()) {
      this.breakNumericMatrix(matrixVertex)
    }
  }

  public breakNumericMatricesInRange(range: AbsoluteCellRange) {
    for (const [_, matrix] of this.matrixMapping.numericMatricesInRange(range)) {
      this.breakNumericMatrix(matrix)
    }
  }

  public breakNumericMatrix(matrixVertex: MatrixVertex) {
    const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
    const adjacentNodes = this.graph.adjacentNodes(matrixVertex)

    for (const address of matrixRange.addresses()) {
      const value = this.getCellValue(address) as number // We wouldn't need that typecast if we would take values from Matrix
      const valueVertex = new ValueCellVertex(value)
      this.addVertex(address, valueVertex)
    }

    for (const adjacentNode of adjacentNodes.values()) {
      const nodeDependencies = collectAddressesDependentToMatrix(this.functionsWhichDoesNotNeedArgumentsToBeComputed, adjacentNode, matrixVertex, this.lazilyTransformingAstService)
      for (const address of nodeDependencies) {
        const vertex = this.fetchCell(address)
        this.graph.addEdge(vertex, adjacentNode)
      }
    }

    this.graph.removeNode(matrixVertex)
    this.matrixMapping.removeMatrix(matrixVertex.getRange())
  }

  public setMatrixEmpty(matrixVertex: MatrixVertex) {
    const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
    const adjacentNodes = this.graph.adjacentNodes(matrixVertex)

    for (const address of matrixRange.addresses()) {
      this.addressMapping.removeCell(address)
    }

    for (const adjacentNode of adjacentNodes.values()) {
      const nodeDependencies = collectAddressesDependentToMatrix(this.functionsWhichDoesNotNeedArgumentsToBeComputed, adjacentNode, matrixVertex, this.lazilyTransformingAstService)
      for (const address of nodeDependencies) {
        const vertex = this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(vertex, adjacentNode)
      }
      if (nodeDependencies.length > 0) {
        this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
      }
    }

    this.graph.removeNode(matrixVertex)
    this.matrixMapping.removeMatrix(matrixVertex.getRange())
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

  public* matrixFormulaNodes(): IterableIterator<MatrixVertex> {
    for (const vertex of this.graph.nodes) {
      if (vertex instanceof MatrixVertex && vertex.isFormula()) {
        yield vertex
      }
    }
  }

  public* entriesFromRowsSpan(rowsSpan: RowsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    yield* this.addressMapping.entriesFromRowsSpan(rowsSpan)
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

  public getCellValue(address: SimpleCellAddress): InternalCellValue {
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
    return this.sheetMapping.fetchDisplayName(sheetId)
  }

  public getSheetHeight(sheet: number): number {
    return this.addressMapping.getHeight(sheet)
  }

  public getSheetWidth(sheet: number): number {
    return this.addressMapping.getWidth(sheet)
  }

  public getMatrix(range: AbsoluteCellRange): Maybe<MatrixVertex> {
    return this.matrixMapping.getMatrix(range)
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex): void {
    this.matrixMapping.setMatrix(range, vertex)
  }

  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex | null {
    return this.rangeMapping.getRange(start, end)
  }

  public topSortWithScc(): TopSortResult<Vertex> {
    return this.graph.topSortWithScc()
  }

  public markAsVolatile(vertex: Vertex) {
    this.graph.markNodeAsSpecial(vertex)
  }

  public markAsDependentOnStructureChange(vertex: Vertex) {
    this.graph.markNodeAsChangingWithStructure(vertex)
  }

  public forceApplyPostponedTransformations() {
    for (const vertex of this.graph.nodes.values()) {
      if (vertex instanceof FormulaCellVertex) {
        vertex.ensureRecentData(this.lazilyTransformingAstService)
      }
    }
  }

  public volatileVertices() {
    return this.graph.specialNodes
  }

  public destroy(): void {
    this.graph.destroy()
    this.addressMapping.destroy()
    this.rangeMapping.destroy()
    this.sheetMapping.destroy()
    this.matrixMapping.destroy()
  }

  private addStructuralNodesToChangeSet() {
    for (const vertex of this.graph.specialNodesStructuralChanges) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }
  }

  private fixRanges(sheet: number, row: number, numberOfRows: number): void {
    for (const rangeVertex of this.rangeMapping.rangesInSheet(sheet)) {
      if (rangeVertex.range.includesRow(row)) {
        const anyVertexInRow = this.addressMapping.getCell(simpleCellAddress(sheet, rangeVertex.start.col, row + numberOfRows))!
        if (this.graph.existsEdge(anyVertexInRow, rangeVertex)) {
          const addedSubrangeInThatRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, rangeVertex.start.col, row), rangeVertex.range.width(), numberOfRows)
          for (const address of addedSubrangeInThatRange.addresses()) {
            this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
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
            this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
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

  private truncateMatricesAfterRemovingRows(removedRows: RowsSpan) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByRows(removedRows)
    verticesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateRangesAfterRemovingRows(removedRows: RowsSpan) {
    const rangesToRemove = this.rangeMapping.truncateRangesByRows(removedRows)
    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateMatricesAfterRemovingColumns(removedColumns: ColumnsSpan) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByColumns(removedColumns)
    verticesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private truncateRangesAfterRemovingColumns(removedColumns: ColumnsSpan) {
    const rangesToRemove = this.rangeMapping.truncateRangesByColumns(removedColumns)
    rangesToRemove.forEach((vertex) => {
      this.graph.removeNode(vertex)
    })
  }

  private expandMatricesAfterAddingRows(sheet: number, rowStart: number, numberOfRows: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowStart))) {
      matrix.addRows(sheet, rowStart, numberOfRows)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, matrix.getAddress().col, rowStart), matrix.width, numberOfRows)
      for (const address of addedRange.addresses()) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }

  private expandMatricesAfterAddingColumns(sheet: number, columnStart: number, numberOfColumns: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInColumns(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnStart))) {
      matrix.addColumns(sheet, columnStart, numberOfColumns)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, columnStart, matrix.getAddress().row), numberOfColumns, matrix.height)
      for (const address of addedRange.addresses()) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }
}
