/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import assert from 'assert'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
import {
  CellError,
  EmptyValue,
  ErrorType,
  InternalCellValue,
  InternalScalarValue,
  simpleCellAddress,
  SimpleCellAddress
} from '../Cell'
import {CellDependency} from '../CellDependency'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Maybe} from '../Maybe'
import {Ast, collectDependencies, NamedExpressionDependency} from '../parser'
import {RowsSpan} from '../RowsSpan'
import {Statistics, StatType} from '../statistics'
import {NamedExpressions} from '../NamedExpressions'
import {
  CellVertex,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  ParsingErrorVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex,
} from './'
import {AddressMapping} from './AddressMapping/AddressMapping'
import {collectAddressesDependentToMatrix} from './collectAddressesDependentToMatrix'
import {Graph, TopSortResult} from './Graph'
import {MatrixMapping} from './MatrixMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {ValueCellVertexValue} from './ValueCellVertex'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {SimpleRangeValue} from '../interpreter/InterpreterValue'

export class DependencyGraph {
  /*
   * Invariants:
   * - empty cell has associated EmptyCellVertex if and only if it is a dependency (possibly indirect, through range) to some formula
   */

  public static buildEmpty(lazilyTransformingAstService: LazilyTransformingAstService, config: Config, functionRegistry: FunctionRegistry, namedExpressions: NamedExpressions, stats: Statistics) {
    const addressMapping = new AddressMapping(config.chooseAddressMappingPolicy)
    const rangeMapping = new RangeMapping()
    return new DependencyGraph(
      addressMapping,
      rangeMapping,
      new SheetMapping(config.translationPackage),
      new MatrixMapping(),
      stats,
      lazilyTransformingAstService,
      functionRegistry,
      namedExpressions
    )
  }

  public readonly graph: Graph<Vertex>

  constructor(
    public readonly addressMapping: AddressMapping,
    public readonly rangeMapping: RangeMapping,
    public readonly sheetMapping: SheetMapping,
    public readonly matrixMapping: MatrixMapping,
    public readonly stats: Statistics,
    public readonly lazilyTransformingAstService: LazilyTransformingAstService,
    public readonly functionRegistry: FunctionRegistry,
    public readonly namedExpressions: NamedExpressions,
  ) {
    this.graph = new Graph<Vertex>(this.dependencyQuery)
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[], hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean) {
    const vertex = this.addressMapping.getCell(address)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    const newVertex = new FormulaCellVertex(ast, address, this.lazilyTransformingAstService.version())
    this.exchangeOrAddGraphNode(vertex, newVertex)
    this.addressMapping.setCell(address, newVertex)

    this.processCellDependencies(dependencies, newVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    if (hasVolatileFunction) {
      this.markAsVolatile(newVertex)
    }
    if (hasStructuralChangeFunction) {
      this.markAsDependentOnStructureChange(newVertex)
    }
    this.correctInfiniteRangesDependency(address)
  }

  public setParsingErrorToCell(address: SimpleCellAddress, errorVertex: ParsingErrorVertex) {
    const vertex = this.addressMapping.getCell(address)
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)
    this.exchangeOrAddGraphNode(vertex, errorVertex)
    this.addressMapping.setCell(address, errorVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(errorVertex)
    this.correctInfiniteRangesDependency(address)
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
      this.exchangeOrAddGraphNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    }

    this.correctInfiniteRangesDependency(address)
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const vertex = this.addressMapping.getCell(address)
    if (vertex === null) {
      return
    }
    this.ensureThatVertexIsNonMatrixCellVertex(vertex)

    if (this.graph.adjacentNodes(vertex).size > 0) {
      const emptyVertex = new EmptyCellVertex(address)
      this.exchangeGraphNode(vertex, emptyVertex)
      if(this.graph.adjacentNodesCount(emptyVertex)===0) {
        this.removeGraphNode(emptyVertex)
        this.addressMapping.removeCell(address)
      } else {
        this.graph.markNodeAsSpecialRecentlyChanged(emptyVertex)
        this.addressMapping.setCell(address, emptyVertex)
      }
    } else {
      this.removeGraphNode(vertex)
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
    cellDependencies.forEach((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        const range = dep

        let rangeVertex = this.getRange(range.start, range.end)
        if (rangeVertex === undefined) {
          rangeVertex = new RangeVertex(range)
          this.rangeMapping.setRange(rangeVertex)
        }

        this.graph.addNode(rangeVertex)
        if (!range.isFinite()) {
          this.graph.markNodeAsInfiniteRange(rangeVertex)
        }

        const {smallerRangeVertex, restRange} = this.rangeMapping.findSmallerRange(range)
        if (smallerRangeVertex) {
          this.graph.addEdge(smallerRangeVertex, rangeVertex)
          if(rangeVertex.bruteForce) {
            rangeVertex.bruteForce = false
            for(const cellFromRange of range.addresses(this)) { //if we ever switch heuristic to processing by sorted sizes, this would be unnecessary
              this.graph.removeEdge(this.fetchCell(cellFromRange), rangeVertex)
            }
          }
        } else {
          rangeVertex.bruteForce = true
        }

        const matrix = this.matrixMapping.getMatrix(restRange)
        if (matrix !== undefined) {
          this.graph.addEdge(matrix, rangeVertex)
        } else {
          for (const cellFromRange of restRange.addresses(this)) {
            this.graph.addEdge(this.fetchCellOrCreateEmpty(cellFromRange), rangeVertex)
          }
        }
        this.graph.addEdge(rangeVertex, endVertex)

        if (range.isFinite()) {
          this.correctInfiniteRangesDependenciesByRangeVertex(rangeVertex)
        }
      } else if (dep instanceof NamedExpressionDependency) {
        const sheetOfVertex = (endVertex as FormulaCellVertex).getAddress(this.lazilyTransformingAstService).sheet
        const namedExpressionVertex = this.fetchNamedExpressionVertex(dep.name, sheetOfVertex)
        this.graph.addEdge(namedExpressionVertex, endVertex)
      } else {
        this.graph.addEdge(this.fetchCellOrCreateEmpty(dep), endVertex)
      }
    })
  }

  public fetchNamedExpressionVertex(expressionName: string, sheetId: number): CellVertex {
    const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(expressionName, sheetId)
    return this.fetchCellOrCreateEmpty(namedExpression.address)
  }

  public exchangeNode(addressFrom: SimpleCellAddress, addressTo: SimpleCellAddress) {
    const vertexFrom = this.fetchCellOrCreateEmpty(addressFrom)
    const vertexTo = this.fetchCellOrCreateEmpty(addressTo)
    this.addressMapping.removeCell(addressFrom)
    this.exchangeGraphNode(vertexFrom, vertexTo)
  }

  private correctInfiniteRangesDependenciesByRangeVertex(vertex: RangeVertex) {
    for (const range of this.graph.infiniteRanges) {
      const infiniteRangeVertex = (range as RangeVertex)
      const intersection = vertex.range.intersectionWith(infiniteRangeVertex.range)
      if (intersection === null) {
        continue
      }
      for (const address of intersection.addresses(this)) {
        this.graph.addEdge(this.fetchCellOrCreateEmpty(address), range)
      }
    }
  }

  public correctInfiniteRangesDependency(address: SimpleCellAddress) {
    let vertex: Vertex | null = null
    for (const range of this.graph.infiniteRanges) {
      const infiniteRangeVertex = (range as RangeVertex)
      if (infiniteRangeVertex.range.addressInRange(address)) {
        vertex = vertex || this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(vertex, infiniteRangeVertex)
      }
    }
  }

  public fetchCellOrCreateEmpty(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (!vertex) {
      vertex = new EmptyCellVertex(address)
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
        this.removeGraphNode(vertex)
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
    for (const [adr, vertex] of this.addressMapping.sheetEntries(removedSheetId)) {
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
      this.removeGraphNode(vertex)
      this.addressMapping.removeCell(adr)
    }

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      for (const matrix of matrices.values()) {
        this.matrixMapping.removeMatrix(matrix.getRange())
      }
    })


    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const rangesToRemove = this.rangeMapping.removeRangesInSheet(removedSheetId)
      for (const range of rangesToRemove) {
        this.removeGraphNode(range)
      }

      this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
        this.addressMapping.removeSheet(removedSheetId)
      })
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
        this.removeGraphNode(vertex)
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

      this.rangeMapping.moveAllRangesInSheetAfterRowByRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
      this.fixRanges(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
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
    for (const sourceAddress of sourceRange.addressesWithDirection(toRight, toBottom, this)) {
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
          if (adjacentNode !== sourceVertex) {
            sourceVertex = sourceVertex || this.fetchCellOrCreateEmpty(targetAddress)
            this.graph.addEdge(sourceVertex, adjacentNode)
            this.graph.markNodeAsSpecialRecentlyChanged(sourceVertex)
          }
        }
        this.removeGraphNode(targetVertex)
      }
    }

    for (const rangeVertex of this.rangeMapping.rangeVerticesContainedInRange(sourceRange)) {
      for (const adjacentNode of this.graph.adjacentNodes(rangeVertex)) {
        if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
          this.graph.removeEdge(rangeVertex, adjacentNode)

          for (const address of rangeVertex.range.addresses(this)) {
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

    for (const address of matrixRange.addresses(this)) {
      const value = this.getCellValue(address) as number // We wouldn't need that typecast if we would take values from Matrix
      const valueVertex = new ValueCellVertex(value)
      this.addVertex(address, valueVertex)
    }

    for (const adjacentNode of adjacentNodes.values()) {
      const nodeDependencies = collectAddressesDependentToMatrix(this.functionRegistry, adjacentNode, matrixVertex, this.lazilyTransformingAstService, this)
      for (const address of nodeDependencies) {
        const vertex = this.fetchCell(address)
        this.graph.addEdge(vertex, adjacentNode)
      }
    }

    this.removeGraphNode(matrixVertex)
    this.matrixMapping.removeMatrix(matrixVertex.getRange())
  }

  public setMatrixEmpty(matrixVertex: MatrixVertex) {
    const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(), matrixVertex.width, matrixVertex.height)
    const adjacentNodes = this.graph.adjacentNodes(matrixVertex)

    for (const address of matrixRange.addresses(this)) {
      this.addressMapping.removeCell(address)
    }

    for (const adjacentNode of adjacentNodes.values()) {
      const nodeDependencies = collectAddressesDependentToMatrix(this.functionRegistry, adjacentNode, matrixVertex, this.lazilyTransformingAstService, this)
      for (const address of nodeDependencies) {
        const vertex = this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(vertex, adjacentNode)
      }
      if (nodeDependencies.length > 0) {
        this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
      }
    }

    this.removeGraphNode(matrixVertex)
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
    for (const vertex of this.verticesFromRange(range)) {
      if (vertex instanceof MatrixVertex) {
        throw Error('You cannot modify only part of an array')
      }
    }

    this.setMatrix(range, matrixVertex)

    for (const [address, vertex] of this.entriesFromRange(range)) {
      if (vertex) {
        this.exchangeGraphNode(vertex, matrixVertex)
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

  public* entriesFromColumnsSpan(columnsSpan: ColumnsSpan): IterableIterator<[SimpleCellAddress, CellVertex]> {
    yield* this.addressMapping.entriesFromColumnsSpan(columnsSpan)
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

  public getScalarValue(address: SimpleCellAddress): InternalScalarValue {
    const value = this.addressMapping.getCellValue(address)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return value
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

  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): Maybe<RangeVertex> {
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
    const originalValues: RangeVertex[] = Array.from(this.rangeMapping.rangesInSheet(sheet))
    for(const rangeVertex of originalValues) {
      if (rangeVertex.range.includesRow(row+numberOfRows)) {
        if(rangeVertex.bruteForce) {
          const addedSubrangeInThatRange = rangeVertex.range.rangeWithSameWidth(row, numberOfRows)
          for (const address of addedSubrangeInThatRange.addresses(this)) {
            this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
          }
        } else {
          let currentRangeVertex = rangeVertex
          let find = this.rangeMapping.findSmallerRange(currentRangeVertex.range)
          if(find.smallerRangeVertex !== null) {
            continue
          }
          while(find.smallerRangeVertex === null) {
            const newRangeVertex = new RangeVertex(AbsoluteCellRange.spanFrom(currentRangeVertex.range.start, currentRangeVertex.range.width(), currentRangeVertex.range.height() - 1))
            this.rangeMapping.setRange(newRangeVertex)
            this.graph.addNode(newRangeVertex)
            const restRange = new AbsoluteCellRange(simpleCellAddress(currentRangeVertex.range.start.sheet, currentRangeVertex.range.start.col, currentRangeVertex.range.end.row), currentRangeVertex.range.end)
            this.addAllFromRange(restRange, currentRangeVertex)
            this.graph.addEdge(newRangeVertex, currentRangeVertex)
            currentRangeVertex = newRangeVertex
            find = this.rangeMapping.findSmallerRange(currentRangeVertex.range)
          }
          this.graph.addEdge(find.smallerRangeVertex, currentRangeVertex)
          this.addAllFromRange(find.restRange, currentRangeVertex)
          this.graph.removeEdge(find.smallerRangeVertex, rangeVertex)
        }
      }
    }
  }

  private addAllFromRange(range: AbsoluteCellRange, vertex: RangeVertex) {
    for(const address of range.addresses(this)) {
      this.graph.addEdge(this.fetchCellOrCreateEmpty(address), vertex)
    }
  }

  private fixRangesWhenAddingColumns(sheet: number, column: number, numberOfColumns: number): void {
    for (const rangeVertex of this.rangeMapping.rangesInSheet(sheet)) {
      if (rangeVertex.range.includesColumn(column)) {
        let subrange
        if(rangeVertex.bruteForce) {
          subrange = rangeVertex.range.rangeWithSameHeight(column, numberOfColumns)
        } else {
          subrange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, column, rangeVertex.range.end.row), numberOfColumns, 1)
        }
        for (const address of subrange.addresses(this)) {
          this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
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

    for (const address of range.addresses(this)) {
      this.setVertexAddress(address, vertex)
    }
  }

  private truncateMatricesAfterRemovingRows(removedRows: RowsSpan) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByRows(removedRows)
    verticesToRemove.forEach((vertex) => {
      this.removeGraphNode(vertex)
    })
  }

  private truncateRangesAfterRemovingRows(removedRows: RowsSpan) {
    const rangesToRemove = this.rangeMapping.truncateRangesByRows(removedRows)
    rangesToRemove.forEach((vertex) => {
      this.removeGraphNode(vertex)
    })
  }

  private truncateMatricesAfterRemovingColumns(removedColumns: ColumnsSpan) {
    const verticesToRemove = this.matrixMapping.truncateMatricesByColumns(removedColumns)
    verticesToRemove.forEach((vertex) => {
      this.removeGraphNode(vertex)
    })
  }

  private truncateRangesAfterRemovingColumns(removedColumns: ColumnsSpan) {
    const rangesToRemove = this.rangeMapping.truncateRangesByColumns(removedColumns)
    rangesToRemove.forEach((vertex) => {
      this.removeGraphNode(vertex)
    })
  }

  private expandMatricesAfterAddingRows(sheet: number, rowStart: number, numberOfRows: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowStart))) {
      matrix.addRows(sheet, rowStart, numberOfRows)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, matrix.getAddress().col, rowStart), matrix.width, numberOfRows)
      for (const address of addedRange.addresses(this)) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }

  private expandMatricesAfterAddingColumns(sheet: number, columnStart: number, numberOfColumns: number) {
    for (const [, matrix] of this.matrixMapping.numericMatricesInColumns(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnStart))) {
      matrix.addColumns(sheet, columnStart, numberOfColumns)
      const addedRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, columnStart, matrix.getAddress().row), numberOfColumns, matrix.height)
      for (const address of addedRange.addresses(this)) {
        this.addressMapping.setCell(address, matrix)
      }
    }
  }

  public* verticesFromRange(range: AbsoluteCellRange): IterableIterator<CellVertex> {
    for (const address of range.addresses(this)) {
      const vertex = this.getCell(address)
      if (vertex) {
        yield vertex
      }
    }
  }

  public* valuesFromRange(range: AbsoluteCellRange): IterableIterator<[InternalScalarValue, SimpleCellAddress]> {
    for (const address of range.addresses(this)) {
      const value = this.getScalarValue(address)
      if (value !== EmptyValue) {
        yield [value, address]
      }
    }
  }

  public* entriesFromRange(range: AbsoluteCellRange): IterableIterator<[SimpleCellAddress, CellVertex | null]> {
    for (const address of range.addresses(this)) {
      yield [address, this.getCell(address)]
    }
  }

  public exchangeGraphNode(oldNode: Vertex, newNode: Vertex) {
    this.graph.addNode(newNode)
    const adjNodesStored = this.graph.adjacentNodes(oldNode)
    this.removeGraphNode(oldNode)
    adjNodesStored.forEach((adjacentNode) => {
      if(this.graph.hasNode(adjacentNode)) {
        this.graph.addEdge(newNode, adjacentNode)
      }
    })
  }

  public exchangeOrAddGraphNode(oldNode: Vertex | null, newNode: Vertex) {
    if (oldNode) {
      this.exchangeGraphNode(oldNode, newNode)
    } else {
      this.graph.addNode(newNode)
    }
  }

  public removeGraphNode(node: Vertex) {
    const candidates = this.graph.removeNode(node)
    if(node instanceof RangeVertex) {
      this.rangeMapping.removeRange(node)
    }
    while(candidates.size > 0) {
      const vertex: Vertex = candidates.values().next().value
      candidates.delete(vertex)
      if(this.graph.hasNode(vertex) && this.graph.adjacentNodesCount(vertex) === 0) {
        if(vertex instanceof RangeVertex || vertex instanceof EmptyCellVertex) {
          this.graph.removeNode(vertex).forEach((candidate) => candidates.add(candidate))
        }
        if(vertex instanceof RangeVertex) {
          this.rangeMapping.removeRange(vertex)
        } else if(vertex instanceof EmptyCellVertex) {
          this.addressMapping.removeCell(vertex.address)
        }
      }
    }
  }

  public dependencyQuery: (vertex: Vertex) => Set<Vertex> | null = (vertex: Vertex) => {
    let formula: Ast
    let address: SimpleCellAddress

    if (vertex instanceof FormulaCellVertex) {
      address = vertex.getAddress(this.lazilyTransformingAstService)
      formula = vertex.getFormula(this.lazilyTransformingAstService)
    } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
      address = vertex.getAddress()
      formula = vertex.getFormula()!
    } else if (vertex instanceof RangeVertex) {
      const allDeps: Set<Vertex> = new Set()
      const {smallerRangeVertex, restRange} = this.rangeMapping.findSmallerRange(vertex.range) //checking whether this range was splitted by bruteForce or not
      let range
      if(smallerRangeVertex !== null && this.graph.adjacentNodes(smallerRangeVertex).has(vertex)) {
        range = restRange
        allDeps.add(smallerRangeVertex)
      } else { //did we ever need to use full range
        range = vertex.range
      }
      for(const address of range.addresses(this)) {
        const cell = this.addressMapping.getCell(address)
        if(cell instanceof EmptyCellVertex) {
          cell.address = address
        }
        if(cell !== null) {
          allDeps.add(cell)
        }
      }
      return allDeps
    } else {
      return null
    }

    const deps = collectDependencies(formula!, this.functionRegistry)
    const absoluteDeps = absolutizeDependencies(deps, address)
    return new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping.fetchRange(dep.start, dep.end)
      } else if (dep instanceof NamedExpressionDependency) {
        const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(dep.name, address.sheet)
        return this.addressMapping.fetchCell(namedExpression.address)
      } else {
        return this.addressMapping.fetchCell(dep)
      }
    }))
  }
}
