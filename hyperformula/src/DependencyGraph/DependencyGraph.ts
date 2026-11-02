/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, SimpleCellRange, simpleCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
import {ArraySize} from '../ArraySize'
import {CellError, ErrorType, isSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {CellDependency} from '../CellDependency'
import {Config} from '../Config'
import {ContentChanges} from '../ContentChanges'
import {ErrorMessage} from '../error-message'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  RawScalarValue
} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
import {Ast, collectDependencies, NamedExpressionDependency} from '../parser'
import {ColumnsSpan, RowsSpan, Span} from '../Span'
import {Statistics, StatType} from '../statistics'
import {
  ArrayFormulaVertex,
  CellVertex,
  EmptyCellVertex,
  ScalarFormulaVertex,
  ParsingErrorVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex,
} from './'
import {AddressMapping} from './AddressMapping/AddressMapping'
import {ArrayMapping} from './ArrayMapping'
import {collectAddressesDependentToRange} from './collectAddressesDependentToRange'
import {FormulaVertex} from './FormulaVertex'
import {DependencyQuery, Graph} from './Graph'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {SheetReferenceRegistrar} from './SheetReferenceRegistrar'
import {RawAndParsedValue} from './ValueCellVertex'
import {TopSortResult} from './TopSort'
import { findBoundaries } from '../Sheet'

export class DependencyGraph {
  public readonly graph: Graph<Vertex>
  private changes: ContentChanges = ContentChanges.empty()
  public readonly sheetReferenceRegistrar: SheetReferenceRegistrar

  constructor(
    public readonly addressMapping: AddressMapping,
    public readonly rangeMapping: RangeMapping,
    public readonly sheetMapping: SheetMapping,
    public readonly arrayMapping: ArrayMapping,
    public readonly stats: Statistics,
    public readonly lazilyTransformingAstService: LazilyTransformingAstService,
    public readonly functionRegistry: FunctionRegistry,
    public readonly namedExpressions: NamedExpressions,
  ) {
    this.graph = new Graph<Vertex>(this.dependencyQueryVertices)
    this.sheetReferenceRegistrar = new SheetReferenceRegistrar(sheetMapping, addressMapping)
  }

  /**
   * Invariants:
   * - empty cell has associated EmptyCellVertex if and only if it is a dependency (possibly indirect, through range) to some formula
   */

  public static buildEmpty(lazilyTransformingAstService: LazilyTransformingAstService, config: Config, functionRegistry: FunctionRegistry, namedExpressions: NamedExpressions, stats: Statistics) {
    return new DependencyGraph(
      new AddressMapping(config.chooseAddressMappingPolicy),
      new RangeMapping(),
      new SheetMapping(config.translationPackage),
      new ArrayMapping(),
      stats,
      lazilyTransformingAstService,
      functionRegistry,
      namedExpressions
    )
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[], size: ArraySize, hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean): ContentChanges {
    const newVertex = FormulaVertex.fromAst(ast, address, size, this.lazilyTransformingAstService.version())
    this.exchangeOrAddFormulaVertex(newVertex)
    this.processCellDependencies(dependencies, newVertex)
    this.graph.markNodeAsDirty(newVertex)
    if (hasVolatileFunction) {
      this.markAsVolatile(newVertex)
    }
    if (hasStructuralChangeFunction) {
      this.markAsDependentOnStructureChange(newVertex)
    }
    this.correctInfiniteRangesDependency(address)
    return this.getAndClearContentChanges()
  }

  public setParsingErrorToCell(address: SimpleCellAddress, errorVertex: ParsingErrorVertex): ContentChanges {
    const vertex = this.shrinkPossibleArrayAndGetCell(address)
    this.exchangeOrAddGraphNode(vertex, errorVertex)
    this.addressMapping.setCell(address, errorVertex)
    this.graph.markNodeAsDirty(errorVertex)
    this.correctInfiniteRangesDependency(address)
    return this.getAndClearContentChanges()
  }

  public setValueToCell(address: SimpleCellAddress, value: RawAndParsedValue): ContentChanges {
    const vertex = this.shrinkPossibleArrayAndGetCell(address)

    if (vertex instanceof ArrayFormulaVertex) {
      this.arrayMapping.removeArray(vertex.getRange())
    }

    if (vertex instanceof ValueCellVertex) {
      const oldValues = vertex.getValues()
      if (oldValues.rawValue !== value.rawValue) {
        vertex.setValues(value)
        this.graph.markNodeAsDirty(vertex)
      }
    } else {
      const newVertex = new ValueCellVertex(value.parsedValue, value.rawValue)
      this.exchangeOrAddGraphNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.graph.markNodeAsDirty(newVertex)
    }

    this.correctInfiniteRangesDependency(address)

    return this.getAndClearContentChanges()
  }

  /**
   * Sets a cell empty.
   * - if vertex has no dependents, removes it from graph, address mapping and range mapping and cleans up its dependencies
   * - if vertex has dependents, exchanges it for an EmptyCellVertex and marks it as dirty
   */
  public setCellEmpty(address: SimpleCellAddress): ContentChanges {
    const vertex = this.shrinkPossibleArrayAndGetCell(address)
    if (vertex === undefined) {
      return ContentChanges.empty()
    }
    if (this.graph.adjacentNodes(vertex).size > 0) {
      const emptyVertex = new EmptyCellVertex()
      this.exchangeGraphNode(vertex, emptyVertex)
      if (this.graph.adjacentNodesCount(emptyVertex) === 0) {
        this.removeVertex(emptyVertex)
        this.addressMapping.removeCell(address)
      } else {
        this.graph.markNodeAsDirty(emptyVertex)
        this.addressMapping.setCell(address, emptyVertex)
      }
    } else {
      this.removeVertex(vertex)
      this.addressMapping.removeCell(address)
    }

    return this.getAndClearContentChanges()
  }

  public clearDirtyVertices() {
    this.graph.clearDirtyNodes()
  }

  public verticesToRecompute(): Vertex[] {
    return this.graph.getDirtyAndVolatileNodes()
  }

  public processCellDependencies(cellDependencies: CellDependency[], endVertex: Vertex) {
    const endVertexId = endVertex.idInGraph

    if (endVertexId === undefined) {
      throw new Error('End vertex not found')
    }

    cellDependencies.forEach((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        const range = dep

        let rangeVertex = this.getRange(range.start, range.end)
        if (rangeVertex === undefined) {
          rangeVertex = new RangeVertex(range)
          this.rangeMapping.addOrUpdateVertex(rangeVertex)
        }

        this.graph.addNodeIfNotExists(rangeVertex)
        const rangeVertexId = rangeVertex.idInGraph

        if (rangeVertexId === undefined) {
          throw new Error('Range vertex not found')
        }

        if (!range.isFinite()) {
          this.graph.markNodeAsInfiniteRange(rangeVertexId)
        }

        const {smallerRangeVertex, restRange} = this.rangeMapping.findSmallerRange(range)
        if (smallerRangeVertex !== undefined) {
          this.graph.addEdge(smallerRangeVertex, rangeVertexId)
          if (rangeVertex.bruteForce) {
            rangeVertex.bruteForce = false
            for (const cellFromRange of range.addresses(this)) { //if we ever switch heuristic to processing by sorted sizes, this would be unnecessary
              this.graph.removeEdge(this.fetchCell(cellFromRange), rangeVertexId)
            }
          }
        } else {
          rangeVertex.bruteForce = true
        }

        const array = this.arrayMapping.getArray(restRange)
        if (array !== undefined) {
          this.graph.addEdge(array, rangeVertexId)
        } else {
          for (const cellFromRange of restRange.addresses(this)) {
            const { vertex, id } = this.fetchCellOrCreateEmpty(cellFromRange)
            this.graph.addEdge(id ?? vertex, rangeVertexId)
          }
        }
        this.graph.addEdge(rangeVertexId, endVertexId)

        if (range.isFinite()) {
          this.correctInfiniteRangesDependenciesByRangeVertex(rangeVertex)
        }
      } else if (dep instanceof NamedExpressionDependency) {
        const sheetOfVertex = (endVertex as ScalarFormulaVertex).getAddress(this.lazilyTransformingAstService).sheet
        const { vertex, id } = this.fetchNamedExpressionVertex(dep.name, sheetOfVertex)
        this.graph.addEdge(id ?? vertex, endVertexId)
      } else {
        const { vertex, id } = this.fetchCellOrCreateEmpty(dep)
        this.graph.addEdge(id ?? vertex, endVertexId)
      }
    })
  }

  public fetchNamedExpressionVertex(expressionName: string, sheetId: number): { vertex: CellVertex, id: Maybe<number>} {
    const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(expressionName, sheetId)
    return this.fetchCellOrCreateEmpty(namedExpression.address)
  }

  public exchangeNode(addressFrom: SimpleCellAddress, addressTo: SimpleCellAddress) {
    const vertexFrom = this.fetchCellOrCreateEmpty(addressFrom).vertex
    const vertexTo = this.fetchCellOrCreateEmpty(addressTo).vertex
    this.addressMapping.removeCell(addressFrom)
    this.exchangeGraphNode(vertexFrom, vertexTo)
  }

  public fetchCellOrCreateEmpty(address: SimpleCellAddress): { vertex: CellVertex, id: Maybe<number> } {
    const existingVertex = this.addressMapping.getCell(address)

    if (existingVertex !== undefined) {
      return { vertex: existingVertex, id: undefined }
    }

    const newVertex = new EmptyCellVertex()
    const newVertexId = this.graph.addNodeIfNotExists(newVertex)
    this.addressMapping.setCell(address, newVertex)

    return { vertex: newVertex, id: newVertexId }
  }

  public removeRows(removedRows: RowsSpan): EagerChangesGraphChangeResult {
    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const [address, vertex] of this.addressMapping.entriesFromRowsSpan(removedRows)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsDirty(adjacentNode)
        }
        if (vertex instanceof ArrayFormulaVertex) {
          if (vertex.isLeftCorner(address)) {
            this.shrinkArrayToCorner(vertex)
            this.arrayMapping.removeArray(vertex.getRange())
          } else {
            continue
          }
        }
        this.removeVertex(vertex)
      }
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeRows(removedRows)
    })

    const affectedArrays = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const affectedRanges = this.truncateRanges(removedRows, address => address.row)
      return this.getArrayVerticesRelatedToRanges(affectedRanges)
    })

    this.stats.measure(StatType.ADJUSTING_ARRAY_MAPPING, () => {
      this.fixArraysAfterRemovingRows(removedRows.sheet, removedRows.rowStart, removedRows.numberOfRows)
    })

    this.addStructuralNodesToChangeSet()

    return {
      affectedArrays,
      contentChanges: this.getAndClearContentChanges()
    }
  }

  /**
   * Adds a new sheet to the graph.
   * If the sheetId was a placeholder sheet, marks its vertices as dirty.
   */
  public addSheet(sheetId: number): void {
    this.addressMapping.addSheetOrChangeStrategy(sheetId, findBoundaries([]))

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.markAllCellsAsDirtyInSheet(sheetId)
    })

    this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      this.markAllRangesAsDirtyInSheet(sheetId)
    })
  }

  /**
   * Removes all vertices without dependents in other sheets from address mapping, range mapping and array mapping.
   * - If nothing is left, removes the sheet from sheet mapping and address mapping.
   * - Otherwise, marks it as placeholder.
   */
  public removeSheet(sheetId: number): void {
    this.clearSheet(sheetId)
    const addressMappingCleared = !this.addressMapping.hasAnyEntries(sheetId)
    const rangeMappingCleared = this.rangeMapping.getNumberOfRangesInSheet(sheetId) === 0

    if (addressMappingCleared && rangeMappingCleared) {
      this.sheetMapping.removeSheetIfExists(sheetId)
      this.addressMapping.removeSheetIfExists(sheetId)
    } else {
      this.sheetMapping.markSheetAsPlaceholder(sheetId)
    }
  }

  /**
   * Removes placeholderSheetToDelete and reroutes edges to the corresponding vertices in sheetToKeep
   *
   * Assumptions about placeholderSheetToDelete:
   * - is empty (contains only empty cell vertices and range vertices),
   * - empty cell vertices have no dependencies,
   * - range vertices have dependencies only in placeholderSheetToDelete,
   * - vertices may have dependents in placeholderSheetToDelete and other sheets,
   */
  public mergeSheets(sheetToKeep: number, placeholderSheetToDelete: number): void {
    if (!this.isPlaceholder(placeholderSheetToDelete)) {
      throw new Error(`Cannot merge sheets: sheet ${placeholderSheetToDelete} is not a placeholder`)
    }

    this.mergeRangeVertices(sheetToKeep, placeholderSheetToDelete)
    this.mergeCellVertices(sheetToKeep, placeholderSheetToDelete)
    this.addressMapping.removeSheetIfExists(placeholderSheetToDelete)
    this.addStructuralNodesToChangeSet()
  }

  /**
   * Clears the sheet content.
   * - removes all cell vertices without dependents
   * - removes all array vertices
   * - for vertices with dependents, exchanges them for EmptyCellVertex and marks them as dirty
   */
  public clearSheet(sheetId: number) {
    const arrays: Set<ArrayFormulaVertex> = new Set()
    for (const [address, vertex] of this.addressMapping.sheetEntries(sheetId)) {
      if (vertex instanceof ArrayFormulaVertex) {
        arrays.add(vertex)
      } else {
        this.setCellEmpty(address)
      }
    }

    for (const array of arrays.values()) {
      this.setArrayEmpty(array)
    }

    this.addStructuralNodesToChangeSet()
  }

  public removeColumns(removedColumns: ColumnsSpan): EagerChangesGraphChangeResult {
    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const [address, vertex] of this.addressMapping.entriesFromColumnsSpan(removedColumns)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsDirty(adjacentNode)
        }
        if (vertex instanceof ArrayFormulaVertex) {
          if (vertex.isLeftCorner(address)) {
            this.shrinkArrayToCorner(vertex)
            this.arrayMapping.removeArray(vertex.getRange())
          } else {
            continue
          }
        }
        this.removeVertex(vertex)
      }
    })

    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.removeColumns(removedColumns)
    })

    const affectedArrays = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const affectedRanges = this.truncateRanges(removedColumns, address => address.col)
      return this.getArrayVerticesRelatedToRanges(affectedRanges)
    })

    this.stats.measure(StatType.ADJUSTING_ARRAY_MAPPING, () => {
      return this.fixArraysAfterRemovingColumns(removedColumns.sheet, removedColumns.columnStart, removedColumns.numberOfColumns)
    })

    this.addStructuralNodesToChangeSet()

    return {
      affectedArrays,
      contentChanges: this.getAndClearContentChanges(),
    }
  }

  public addRows(addedRows: RowsSpan): ArrayAffectingGraphChangeResult {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    const affectedArrays = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const result = this.rangeMapping.moveAllRangesInSheetAfterAddingRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
      this.fixRangesWhenAddingRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
      return this.getArrayVerticesRelatedToRanges(result.verticesWithChangedSize)
    })

    this.stats.measure(StatType.ADJUSTING_ARRAY_MAPPING, () => {
      this.fixArraysAfterAddingRow(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    for (const vertex of this.addressMapping.verticesFromRowsSpan(addedRows)) {
      this.graph.markNodeAsDirty(vertex)
    }

    this.addStructuralNodesToChangeSet()

    return {affectedArrays}
  }

  public addColumns(addedColumns: ColumnsSpan): EagerChangesGraphChangeResult {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    const affectedArrays = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const result = this.rangeMapping.moveAllRangesInSheetAfterAddingColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
      this.fixRangesWhenAddingColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
      return this.getArrayVerticesRelatedToRanges(result.verticesWithChangedSize)
    })

    this.stats.measure(StatType.ADJUSTING_ARRAY_MAPPING, () => {
      return this.fixArraysAfterAddingColumn(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    for (const vertex of this.addressMapping.verticesFromColumnsSpan(addedColumns)) {
      this.graph.markNodeAsDirty(vertex)
    }

    this.addStructuralNodesToChangeSet()

    return {affectedArrays, contentChanges: this.getAndClearContentChanges()}
  }

  public isThereSpaceForArray(arrayVertex: ArrayFormulaVertex): boolean {
    const range = arrayVertex.getRangeOrUndef()
    if (range === undefined) {
      return false
    }
    for (const address of range.addresses(this)) {
      const vertexUnderAddress = this.addressMapping.getCell(address)
      if (vertexUnderAddress !== undefined && !(vertexUnderAddress instanceof EmptyCellVertex) && vertexUnderAddress !== arrayVertex) {
        return false
      }
    }
    return true
  }

  public moveCells(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    for (const sourceAddress of sourceRange.addressesWithDirection(toRight, toBottom, this)) {
      const targetAddress = simpleCellAddress(toSheet, sourceAddress.col + toRight, sourceAddress.row + toBottom)
      let sourceVertex = this.addressMapping.getCell(sourceAddress)
      const targetVertex = this.addressMapping.getCell(targetAddress)

      this.addressMapping.removeCell(sourceAddress)

      if (sourceVertex !== undefined) {
        this.graph.markNodeAsDirty(sourceVertex)
        this.addressMapping.setCell(targetAddress, sourceVertex)
        let emptyVertex = undefined
        for (const adjacentNode of this.graph.adjacentNodes(sourceVertex)) {
          if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
            emptyVertex = emptyVertex ?? this.fetchCellOrCreateEmpty(sourceAddress).vertex
            this.graph.addEdge(emptyVertex, adjacentNode)
            this.graph.removeEdge(sourceVertex, adjacentNode)
          }
        }
        if (emptyVertex) {
          this.graph.markNodeAsDirty(emptyVertex)
          this.addressMapping.setCell(sourceAddress, emptyVertex)
        }
      }

      if (targetVertex !== undefined) {
        if (sourceVertex === undefined) {
          this.addressMapping.removeCell(targetAddress)
        }
        for (const adjacentNode of this.graph.adjacentNodes(targetVertex)) {
          sourceVertex = sourceVertex ?? this.fetchCellOrCreateEmpty(targetAddress).vertex
          this.graph.addEdge(sourceVertex, adjacentNode)
          this.graph.markNodeAsDirty(sourceVertex)
        }
        this.removeVertex(targetVertex)
      }
    }

    for (const rangeVertex of this.rangeMapping.rangeVerticesContainedInRange(sourceRange)) {
      for (const adjacentNode of this.graph.adjacentNodes(rangeVertex)) {
        if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
          this.graph.removeEdge(rangeVertex, adjacentNode)

          for (const address of rangeVertex.range.addresses(this)) {
            const { vertex, id } = this.fetchCellOrCreateEmpty(address)
            this.graph.addEdge(id ?? vertex, adjacentNode)
            this.addressMapping.setCell(address, vertex)
            this.graph.markNodeAsDirty(vertex)
          }
        }
      }
    }

    this.rangeMapping.moveRangesInsideSourceRange(sourceRange, toRight, toBottom, toSheet)
  }

  /**
   * Sets an array empty.
   * - removes all corresponding entries from address mapping
   * - reroutes the edges
   * - removes vertex from graph and cleans up its dependencies
   * - removes vertex from range mapping and array mapping
   */
  public setArrayEmpty(arrayVertex: ArrayFormulaVertex) {
    const arrayRange = AbsoluteCellRange.spanFrom(arrayVertex.getAddress(this.lazilyTransformingAstService), arrayVertex.width, arrayVertex.height)
    const dependentVertices = this.graph.adjacentNodes(arrayVertex)

    for (const address of arrayRange.addresses(this)) {
      this.addressMapping.removeCell(address)
    }

    for (const adjacentNode of dependentVertices.values()) {
      const nodeDependencies = collectAddressesDependentToRange(this.functionRegistry, adjacentNode, arrayVertex.getRange(), this.lazilyTransformingAstService, this)
      for (const address of nodeDependencies) {
        const { vertex, id } = this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(id ?? vertex, adjacentNode)
      }
      if (nodeDependencies.length > 0) {
        this.graph.markNodeAsDirty(adjacentNode)
      }
    }

    this.removeVertex(arrayVertex)
    this.arrayMapping.removeArray(arrayVertex.getRange())
  }

  public addVertex(address: SimpleCellAddress, vertex: CellVertex): void {
    this.graph.addNodeIfNotExists(vertex)
    this.addressMapping.setCell(address, vertex)
  }

  public addArrayVertex(address: SimpleCellAddress, vertex: ArrayFormulaVertex): void {
    this.graph.addNodeIfNotExists(vertex)
    this.setAddressMappingForArrayVertex(vertex, address)
  }

  /**
   * Iterator over all array formula nodes in the graph.
   */
  public* arrayFormulaNodes(): IterableIterator<ArrayFormulaVertex> {
    for (const vertex of this.graph.getNodes()) {
      if (vertex instanceof ArrayFormulaVertex) {
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

  public fetchCell(address: SimpleCellAddress): CellVertex {
    return this.addressMapping.getCellOrThrow(address)
  }

  /**
   * Gets the cell vertex at the specified address.
   * @throws {NoSheetWithIdError} if sheet doesn't exist
   */
  public getCell(address: SimpleCellAddress): Maybe<CellVertex> {
    return this.addressMapping.getCell(address, { throwIfSheetNotExists: true })
  }

  public getCellValue(address: SimpleCellAddress): InterpreterValue {
    if (this.isPlaceholder(address.sheet)) {
      return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
    }

    return this.addressMapping.getCellValue(address)
  }

  public getRawValue(address: SimpleCellAddress): RawCellContent {
    if (this.isPlaceholder(address.sheet)) {
      return null
    }

    return this.addressMapping.getRawValue(address)
  }

  public getScalarValue(address: SimpleCellAddress): InternalScalarValue {
    if (this.isPlaceholder(address.sheet)) {
      return new CellError(ErrorType.REF, ErrorMessage.SheetRef)
    }

    const value = this.addressMapping.getCellValue(address)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
    }
    return value
  }

  public existsEdge(fromNode: Vertex, toNode: Vertex): boolean {
    return this.graph.existsEdge(fromNode, toNode)
  }

  public getSheetId(sheetName: string): number {
    return this.sheetMapping.getSheetIdOrThrowError(sheetName)
  }

  public getSheetHeight(sheet: number): number {
    return this.addressMapping.getSheetHeight(sheet)
  }

  public getSheetWidth(sheet: number): number {
    return this.addressMapping.getSheetWidth(sheet)
  }

  public getArray(range: AbsoluteCellRange): Maybe<ArrayFormulaVertex> {
    return this.arrayMapping.getArray(range)
  }

  public getRange(start: SimpleCellAddress, end: SimpleCellAddress): Maybe<RangeVertex> {
    return this.rangeMapping.getRangeVertex(start, end)
  }

  public topSortWithScc(): TopSortResult<Vertex> {
    return this.graph.topSortWithScc()
  }

  public markAsVolatile(vertex: Vertex) {
    this.graph.markNodeAsVolatile(vertex)
  }

  public markAsDependentOnStructureChange(vertex: Vertex): void {
    this.graph.markNodeAsChangingWithStructure(vertex)
  }

  public forceApplyPostponedTransformations() {
    for (const vertex of this.graph.getNodes()) {
      if (vertex instanceof ScalarFormulaVertex) {
        vertex.ensureRecentData(this.lazilyTransformingAstService)
      }
    }
  }

  public* rawValuesFromRange(range: AbsoluteCellRange): IterableIterator<[RawScalarValue, SimpleCellAddress]> {
    for (const address of range.addresses(this)) {
      const value = this.getScalarValue(address)
      if (value !== EmptyValue) {
        yield [getRawValue(value), address]
      }
    }
  }

  public dependencyQueryAddresses: (vertex: Vertex) => (SimpleCellAddress | SimpleCellRange)[] = (vertex: Vertex) => {
    if (vertex instanceof RangeVertex) {
      return this.rangeDependencyQuery(vertex).map(([address, _]) => address)
    } else {
      const dependenciesResult = this.formulaDependencyQuery(vertex)
      if (dependenciesResult !== undefined) {
        const [address, dependencies] = dependenciesResult
        return dependencies.map((dependency: CellDependency) => {
          if (dependency instanceof NamedExpressionDependency) {
            return this.namedExpressions.namedExpressionOrPlaceholder(dependency.name, address.sheet).address
          } else if (isSimpleCellAddress(dependency)) {
            return dependency
          } else {
            return simpleCellRange(dependency.start, dependency.end)
          }
        })
      } else {
        return []
      }
    }
  }

  public computeListOfValuesInRange(range: AbsoluteCellRange): InternalScalarValue[] {
    const values: InternalScalarValue[] = []
    for (const cellFromRange of range.addresses(this)) {
      const value = this.getScalarValue(cellFromRange)
      values.push(value)
    }
    return values
  }

  public shrinkArrayToCorner(array: ArrayFormulaVertex) {
    this.cleanAddressMappingUnderArray(array)
    for (const adjacentVertex of this.adjacentArrayVertices(array)) {
      let relevantDependencies
      if (adjacentVertex instanceof FormulaVertex) {
        relevantDependencies = this.formulaDirectDependenciesToArray(adjacentVertex, array)
      } else {
        relevantDependencies = this.rangeDirectDependenciesToArray(adjacentVertex, array)
      }
      let dependentToCorner = false
      for (const [address, vertex] of relevantDependencies) {
        if (array.isLeftCorner(address)) {
          dependentToCorner = true
        }
        this.graph.addEdge(vertex, adjacentVertex)
        this.graph.markNodeAsDirty(vertex)
      }
      if (!dependentToCorner) {
        this.graph.removeEdge(array, adjacentVertex)
      }
    }
    this.graph.markNodeAsDirty(array)
  }

  public isArrayInternalCell(address: SimpleCellAddress): boolean {
    const vertex = this.getCell(address)
    return vertex instanceof ArrayFormulaVertex && !vertex.isLeftCorner(address)
  }

  public getAndClearContentChanges(): ContentChanges {
    const changes = this.changes
    this.changes = ContentChanges.empty()
    return changes
  }

  public getAdjacentNodesAddresses(inputVertex: Vertex): (SimpleCellRange | SimpleCellAddress)[] {
    const deps = this.graph.adjacentNodes(inputVertex)
    const ret: (SimpleCellRange | SimpleCellAddress)[] = []
    deps.forEach((vertex: Vertex) => {
      if (vertex instanceof RangeVertex) {
        ret.push(simpleCellRange(vertex.start, vertex.end))
      } else if (vertex instanceof FormulaVertex) {
        ret.push(vertex.getAddress(this.lazilyTransformingAstService))
      }
    })
    return ret
  }

  /**
   * Marks all cell vertices in the sheet as dirty.
   */
  private markAllCellsAsDirtyInSheet(sheetId: number): void {
    const sheetCells = this.addressMapping.sheetEntries(sheetId)
    for (const [, vertex] of sheetCells) {
      this.graph.markNodeAsDirty(vertex)
    }
  }

  /**
   * Marks all range vertices in the sheet as dirty.
   */
  private markAllRangesAsDirtyInSheet(sheetId: number): void {
    const sheetRanges = this.rangeMapping.rangesInSheet(sheetId)

    for (const vertex of sheetRanges) {
      this.graph.markNodeAsDirty(vertex)
    }
  }

  /**
   * For each range vertex in placeholderSheetToDelete:
   * - reroutes dependencies and dependents of range vertex to the corresponding vertex in sheetToKeep
   * - removes range vertex from graph and range mapping
   * - cleans up dependencies of the removed vertex
   */
  private mergeRangeVertices(sheetToKeep: number, placeholderSheetToDelete: number): void {
    const rangeVertices = Array.from(this.rangeMapping.rangesInSheet(placeholderSheetToDelete))

    for (const vertexToDelete of rangeVertices) {
      if (!this.graph.hasNode(vertexToDelete)) {
        continue
      }

      const start = vertexToDelete.start
      const end = vertexToDelete.end

      if (start.sheet !== placeholderSheetToDelete && end.sheet !== placeholderSheetToDelete) {
        continue
      }

      const targetStart = simpleCellAddress(sheetToKeep, start.col, start.row)
      const targetEnd = simpleCellAddress(sheetToKeep, end.col, end.row)
      const vertexToKeep = this.rangeMapping.getRangeVertex(targetStart, targetEnd)

      if (vertexToKeep) {
        this.rerouteDependents(vertexToDelete, vertexToKeep)
        this.removeVertexAndRerouteDependencies(vertexToDelete, vertexToKeep)
        this.rangeMapping.removeVertexIfExists(vertexToDelete)
        this.graph.markNodeAsDirty(vertexToKeep)
      } else {
        this.rangeMapping.removeVertexIfExists(vertexToDelete)
        vertexToDelete.range.moveToSheet(sheetToKeep)
        this.rangeMapping.addOrUpdateVertex(vertexToDelete)
        this.graph.markNodeAsDirty(vertexToDelete)
      }
    }
  }

  /**
   * For each cell vertex in placeholderSheetToDelete:
   * - reroutes dependents of cell vertex to the corresponding vertex in sheetToKeep
   * - removes cell vertex from graph and address mapping
   * - cleans up dependencies of the removed vertex
   */
  private mergeCellVertices(sheetToKeep: number, placeholderSheetToDelete: number): void {
    const cellVertices = Array.from(this.addressMapping.sheetEntries(placeholderSheetToDelete)) // placeholder sheet contains only EmptyCellVertex-es

    for (const [addressToDelete, vertexToDelete] of cellVertices) {
      const addressToKeep = simpleCellAddress(sheetToKeep, addressToDelete.col, addressToDelete.row)
      const vertexToKeep = this.getCell(addressToKeep)

      if (vertexToKeep) {
        this.rerouteDependents(vertexToDelete, vertexToKeep)
        this.removeVertexAndCleanupDependencies(vertexToDelete)
        this.addressMapping.removeCell(addressToDelete)
        this.graph.markNodeAsDirty(vertexToKeep)
      } else {
        this.addressMapping.moveCell(addressToDelete, addressToKeep)
        this.graph.markNodeAsDirty(vertexToDelete)
      }
    }
  }

  /**
   * Checks if the given sheet ID refers to a placeholder sheet (doesn't exist but is referenced by other sheets)
   */
  private isPlaceholder(sheetId: number): boolean {
    return sheetId !== NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS &&
      !this.sheetMapping.hasSheetWithId(sheetId, { includePlaceholders: false })
  }

  private exchangeGraphNode(oldNode: Vertex, newNode: Vertex) {
    this.graph.addNodeIfNotExists(newNode)
    const adjNodesStored = this.graph.adjacentNodes(oldNode)
    this.removeVertex(oldNode)
    adjNodesStored.forEach((adjacentNode) => {
      if (this.graph.hasNode(adjacentNode)) {
        this.graph.addEdge(newNode, adjacentNode)
      }
    })
  }

  private setArray(range: AbsoluteCellRange, vertex: ArrayFormulaVertex): void {
    this.arrayMapping.setArray(range, vertex)
  }

  private correctInfiniteRangesDependency(address: SimpleCellAddress) {
    const relevantInfiniteRanges = this.graph.getInfiniteRanges()
    .filter(node => (node as RangeVertex).range.addressInRange(address))

    if (relevantInfiniteRanges.length <= 0) {
      return
    }

    const { vertex, id: maybeVertexId } = this.fetchCellOrCreateEmpty(address)
    const vertexId = maybeVertexId ?? vertex.idInGraph

    if (vertexId === undefined) {
      throw new Error('Vertex not found')
    }

    relevantInfiniteRanges.forEach((node) => {
      this.graph.addEdge(vertexId, node)
    })
  }

  private exchangeOrAddGraphNode(oldNode: Maybe<Vertex>, newNode: Vertex) {
    if (oldNode) {
      this.exchangeGraphNode(oldNode, newNode)
    } else {
      this.graph.addNodeIfNotExists(newNode)
    }
  }

  private dependencyQueryVertices: DependencyQuery<Vertex> = (vertex: Vertex) => {
    if (vertex instanceof RangeVertex) {
      return this.rangeDependencyQuery(vertex)
    } else {
      const dependenciesResult = this.formulaDependencyQuery(vertex)
      if (dependenciesResult !== undefined) {
        const [address, dependencies] = dependenciesResult
        return dependencies.map((dependency: CellDependency) => {
          if (dependency instanceof AbsoluteCellRange) {
            return [dependency.start, this.rangeMapping.getVertexOrThrow(dependency.start, dependency.end)]
          } else if (dependency instanceof NamedExpressionDependency) {
            const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(dependency.name, address.sheet)
            return [namedExpression.address, this.addressMapping.getCellOrThrow(namedExpression.address)]
          } else {
            return [dependency, this.addressMapping.getCellOrThrow(dependency)]
          }
        })
      } else {
        return []
      }
    }
  }

  private getArrayVerticesRelatedToRanges(ranges: RangeVertex[]): Set<ArrayFormulaVertex> {
    const arrayVertices = new Set<ArrayFormulaVertex>()

    ranges.forEach(range => {
      if (!this.graph.hasNode(range)) {
        return
      }

      this.graph.adjacentNodes(range).forEach(adjacentVertex => {
        if (adjacentVertex instanceof ArrayFormulaVertex) {
          arrayVertices.add(adjacentVertex)
        }
      })
    })

    return arrayVertices
  }

  private correctInfiniteRangesDependenciesByRangeVertex(vertex: RangeVertex) {
    this.graph.getInfiniteRanges()
      .forEach((infiniteRangeVertex) => {
        const intersection = vertex.range.intersectionWith((infiniteRangeVertex as RangeVertex).range)

        if (intersection === undefined) {
          return
        }

        intersection.addresses(this).forEach((address: SimpleCellAddress) => {
          const { vertex, id } = this.fetchCellOrCreateEmpty(address)
          this.graph.addEdge(id ?? vertex, infiniteRangeVertex)
        })
      })
  }

  private cleanAddressMappingUnderArray(vertex: ArrayFormulaVertex) {
    const arrayRange = vertex.getRange()
    for (const address of arrayRange.addresses(this)) {
      const oldValue = vertex.getArrayCellValue(address)
      if (this.getCell(address) === vertex) {
        if (vertex.isLeftCorner(address)) {
          this.changes.addChange(new CellError(ErrorType.REF), address, oldValue)
        } else {
          this.addressMapping.removeCell(address)
          this.changes.addChange(EmptyValue, address, oldValue)
        }
      } else {
        this.changes.addChange(EmptyValue, address, oldValue)
      }
    }
  }

  private* formulaDirectDependenciesToArray(vertex: FormulaVertex, array: ArrayFormulaVertex): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const [, formulaDependencies] = this.formulaDependencyQuery(vertex) ?? []
    if (formulaDependencies === undefined) {
      return
    }
    for (const dependency of formulaDependencies) {
      if (dependency instanceof NamedExpressionDependency || dependency instanceof AbsoluteCellRange) {
        continue
      }
      if (array.getRange().addressInRange(dependency)) {
        const vertex = this.fetchCellOrCreateEmpty(dependency).vertex
        yield [dependency, vertex]
      }
    }
  }

  private* rangeDirectDependenciesToArray(vertex: RangeVertex, array: ArrayFormulaVertex): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const {restRange: range} = this.rangeMapping.findSmallerRange(vertex.range)
    for (const address of range.addresses(this)) {
      if (array.getRange().addressInRange(address)) {
        const cell = this.fetchCellOrCreateEmpty(address).vertex
        yield [address, cell]
      }
    }
  }

  private* adjacentArrayVertices(vertex: ArrayFormulaVertex): IterableIterator<FormulaVertex | RangeVertex> {
    const adjacentNodes = this.graph.adjacentNodes(vertex)
    for (const item of adjacentNodes) {
      if (item instanceof FormulaVertex || item instanceof RangeVertex) {
        yield item
      }
    }
  }

  private rangeDependencyQuery: DependencyQuery<Vertex> = (vertex: Vertex) => {
    const allDeps: [(SimpleCellAddress | AbsoluteCellRange), Vertex][] = []
    const {smallerRangeVertex, restRange} = this.rangeMapping.findSmallerRange((vertex as RangeVertex).range) //checking whether this range was splitted by bruteForce or not
    let range

    if (smallerRangeVertex !== undefined && this.graph.adjacentNodes(smallerRangeVertex).has(vertex)) {
      range = restRange
      allDeps.push([new AbsoluteCellRange(smallerRangeVertex.start, smallerRangeVertex.end), smallerRangeVertex])
    } else { //did we ever need to use full range
      range = (vertex as RangeVertex).range
    }

    for (const address of range.addresses(this)) {
      const cell = this.addressMapping.getCell(address)
      if (cell !== undefined) {
        allDeps.push([address, cell])
      }
    }
    return allDeps
  }

  private formulaDependencyQuery: (vertex: Vertex) => Maybe<[SimpleCellAddress, CellDependency[]]> = (vertex: Vertex) => {
    let formula: Ast
    let address: SimpleCellAddress
    if (vertex instanceof FormulaVertex) {
      address = vertex.getAddress(this.lazilyTransformingAstService)
      formula = vertex.getFormula(this.lazilyTransformingAstService)
    } else {
      return undefined
    }
    const deps = collectDependencies(formula, this.functionRegistry)
    return [address, absolutizeDependencies(deps, address)]
  }

  private addStructuralNodesToChangeSet(): void {
    this.graph.markChangingWithStructureNodesAsDirty()
  }

  private fixRangesWhenAddingRows(sheet: number, row: number, numberOfRows: number): void {
    const originalValues: RangeVertex[] = Array.from(this.rangeMapping.rangesInSheet(sheet))
    for (const rangeVertex of originalValues) {
      if (rangeVertex.range.includesRow(row + numberOfRows)) {
        if (rangeVertex.bruteForce) {
          const addedSubrangeInThatRange = rangeVertex.range.rangeWithSameWidth(row, numberOfRows)
          for (const address of addedSubrangeInThatRange.addresses(this)) {
            const { vertex, id } = this.fetchCellOrCreateEmpty(address)
            this.graph.addEdge(id ?? vertex, rangeVertex)
          }
        } else {
          let currentRangeVertex = rangeVertex
          let find = this.rangeMapping.findSmallerRange(currentRangeVertex.range)
          if (find.smallerRangeVertex !== undefined) {
            continue
          }
          while (find.smallerRangeVertex === undefined) {
            const newRangeVertex = new RangeVertex(AbsoluteCellRange.spanFrom(currentRangeVertex.range.start, currentRangeVertex.range.width(), currentRangeVertex.range.height() - 1))
            this.rangeMapping.addOrUpdateVertex(newRangeVertex)
            this.graph.addNodeIfNotExists(newRangeVertex)
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

  private addAllFromRange(range: AbsoluteCellRange, rangeVertex: RangeVertex) {
    for (const address of range.addresses(this)) {
      const { vertex, id } = this.fetchCellOrCreateEmpty(address)
      this.graph.addEdge(id ?? vertex, rangeVertex)
    }
  }

  private fixRangesWhenAddingColumns(sheet: number, column: number, numberOfColumns: number): void {
    for (const rangeVertex of this.rangeMapping.rangesInSheet(sheet)) {
      if (rangeVertex.range.includesColumn(column + numberOfColumns)) {
        let subrange
        if (rangeVertex.bruteForce) {
          subrange = rangeVertex.range.rangeWithSameHeight(column, numberOfColumns)
        } else {
          subrange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheet, column, rangeVertex.range.end.row), numberOfColumns, 1)
        }
        for (const address of subrange.addresses(this)) {
          const { vertex, id } = this.fetchCellOrCreateEmpty(address)
          this.graph.addEdge(id ?? vertex, rangeVertex)
        }
      }
    }
  }

  private exchangeOrAddFormulaVertex(vertex: FormulaVertex): void {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    const range = AbsoluteCellRange.spanFrom(address, vertex.width, vertex.height)
    const oldNode = this.shrinkPossibleArrayAndGetCell(address)
    if (vertex instanceof ArrayFormulaVertex) {
      this.setArray(range, vertex)
    }
    this.exchangeOrAddGraphNode(oldNode, vertex)
    this.addressMapping.setCell(address, vertex)

    if (vertex instanceof ArrayFormulaVertex) {
      if (!this.isThereSpaceForArray(vertex)) {
        return
      }
      for (const cellAddress of range.addresses(this)) {
        if (vertex.isLeftCorner(cellAddress)) {
          continue
        }
        const old = this.getCell(cellAddress)
        this.exchangeOrAddGraphNode(old, vertex)
      }
    }

    for (const cellAddress of range.addresses(this)) {
      this.addressMapping.setCell(cellAddress, vertex)
    }
  }

  private setAddressMappingForArrayVertex(vertex: CellVertex, formulaAddress: SimpleCellAddress): void {
    this.addressMapping.setCell(formulaAddress, vertex)

    if (!(vertex instanceof ArrayFormulaVertex)) {
      return
    }

    const range = AbsoluteCellRange.spanFromOrUndef(formulaAddress, vertex.width, vertex.height)
    if (range === undefined) {
      return
    }
    this.setArray(range, vertex)

    if (!this.isThereSpaceForArray(vertex)) {
      return
    }

    for (const address of range.addresses(this)) {
      this.addressMapping.setCell(address, vertex)
    }
  }

  private truncateRanges(span: Span, coordinate: (address: SimpleCellAddress) => number): RangeVertex[] {
    const {
      verticesToRemove,
      verticesToMerge,
      verticesWithChangedSize
    } = this.rangeMapping.truncateRanges(span, coordinate)
    for (const [existingVertex, mergedVertex] of verticesToMerge) {
      this.rerouteDependents(mergedVertex, existingVertex)
      this.removeVertexAndCleanupDependencies(mergedVertex)
    }
    for (const rangeVertex of verticesToRemove) {
      this.removeVertexAndCleanupDependencies(rangeVertex)
    }
    return verticesWithChangedSize
  }

  private fixArraysAfterAddingRow(sheet: number, rowStart: number, numberOfRows: number) {
    this.arrayMapping.moveArrayVerticesAfterRowByRows(sheet, rowStart, numberOfRows)
    if (rowStart <= 0) {
      return
    }
    for (const [, array] of this.arrayMapping.arraysInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart - 1, rowStart - 1))) {
      const arrayRange = array.getRange()
      for (let col = arrayRange.start.col; col <= arrayRange.end.col; ++col) {
        for (let row = rowStart; row <= arrayRange.end.row; ++row) {
          const destination = simpleCellAddress(sheet, col, row)
          const source = simpleCellAddress(sheet, col, row + numberOfRows)
          const value = array.getArrayCellValue(destination)
          this.addressMapping.moveCell(source, destination)
          this.changes.addChange(EmptyValue, source, value)
        }
      }
    }
  }

  private fixArraysAfterRemovingRows(sheet: number, rowStart: number, numberOfRows: number) {
    this.arrayMapping.moveArrayVerticesAfterRowByRows(sheet, rowStart, -numberOfRows)
    if (rowStart <= 0) {
      return
    }
    for (const [, array] of this.arrayMapping.arraysInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart - 1, rowStart - 1))) {
      if (this.isThereSpaceForArray(array)) {
        for (const address of array.getRange().addresses(this)) {
          this.addressMapping.setCell(address, array)
        }
      } else {
        this.setNoSpaceIfArray(array)
      }
    }
  }

  private fixArraysAfterAddingColumn(sheet: number, columnStart: number, numberOfColumns: number) {
    this.arrayMapping.moveArrayVerticesAfterColumnByColumns(sheet, columnStart, numberOfColumns)
    if (columnStart <= 0) {
      return
    }
    for (const [, array] of this.arrayMapping.arraysInCols(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart - 1, columnStart - 1))) {
      const arrayRange = array.getRange()
      for (let row = arrayRange.start.row; row <= arrayRange.end.row; ++row) {
        for (let col = columnStart; col <= arrayRange.end.col; ++col) {
          const destination = simpleCellAddress(sheet, col, row)
          const source = simpleCellAddress(sheet, col + numberOfColumns, row)
          const value = array.getArrayCellValue(destination)
          this.addressMapping.moveCell(source, destination)
          this.changes.addChange(EmptyValue, source, value)
        }
      }
    }
  }

  private fixArraysAfterRemovingColumns(sheet: number, columnStart: number, numberOfColumns: number) {
    this.arrayMapping.moveArrayVerticesAfterColumnByColumns(sheet, columnStart, -numberOfColumns)
    if (columnStart <= 0) {
      return
    }
    for (const [, array] of this.arrayMapping.arraysInCols(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart - 1, columnStart - 1))) {
      if (this.isThereSpaceForArray(array)) {
        for (const address of array.getRange().addresses(this)) {
          this.addressMapping.setCell(address, array)
        }
      } else {
        this.setNoSpaceIfArray(array)
      }
    }
  }

  private shrinkPossibleArrayAndGetCell(address: SimpleCellAddress): Maybe<CellVertex> {
    const vertex = this.getCell(address)
    if (!(vertex instanceof ArrayFormulaVertex)) {
      return vertex
    }
    this.setNoSpaceIfArray(vertex)
    return this.getCell(address)
  }

  private setNoSpaceIfArray(vertex: Maybe<Vertex>) {
    if (vertex instanceof ArrayFormulaVertex) {
      this.shrinkArrayToCorner(vertex)
      vertex.setNoSpace()
    }
  }

  /**
   * Removes a vertex from the graph and range mapping and cleans up its dependencies.
   */
  private removeVertex(vertex: Vertex) {
    this.removeVertexAndCleanupDependencies(vertex)
    if (vertex instanceof RangeVertex) {
      this.rangeMapping.removeVertexIfExists(vertex)
    }
  }

  /**
   * Reroutes dependent vertices of source to target. Also removes the edge target -> source if it exists.
   */
  private rerouteDependents(source: Vertex, target: Vertex) {
    const dependents = this.graph.adjacentNodes(source)
    this.graph.removeEdgeIfExists(target, source)

    dependents.forEach((adjacentNode) => {
      if (this.graph.hasNode(adjacentNode)) {
        this.graph.addEdge(target, adjacentNode)
      }
    })

  }

  /**
   * Removes a vertex from graph and reroutes its dependencies to other vertex. Also removes the edge vertexToKeep -> vertexToDelete if it exists.
   */
  private removeVertexAndRerouteDependencies(vertexToDelete: Vertex, vertexToKeep: Vertex) {
    const dependencies = this.graph.removeNode(vertexToDelete)

    this.graph.removeEdgeIfExists(vertexToKeep, vertexToDelete)

    dependencies.forEach(([_, dependency]) => {
      if (this.graph.hasNode(dependency)) {
        this.graph.addEdge(dependency, vertexToKeep)
      }
    })
  }

  /**
   * Removes a vertex from graph and cleans up its dependencies.
   * Dependency clean up = remove all RangeVertex and EmptyCellVertex dependencies if no other vertex depends on them.
   * Also cleans up placeholder sheets that have no remaining vertices (not needed anymore)
   */
  private removeVertexAndCleanupDependencies(inputVertex: Vertex) {
    const dependencies = new Set(this.graph.removeNode(inputVertex))
    const affectedSheets = new Set<number>()

    while (dependencies.size > 0) {
      const dependency = dependencies.values().next().value as [SimpleCellAddress | SimpleCellRange, Vertex]

      dependencies.delete(dependency)
      const [address, vertex] = dependency
      if (this.graph.hasNode(vertex) && this.graph.adjacentNodesCount(vertex) === 0) {
        if (vertex instanceof RangeVertex || vertex instanceof EmptyCellVertex) {
          this.graph.removeNode(vertex).forEach((candidate) => dependencies.add(candidate))
        }
        if (vertex instanceof RangeVertex) {
          this.rangeMapping.removeVertexIfExists(vertex)
          affectedSheets.add(vertex.sheet)
        } else if (vertex instanceof EmptyCellVertex && isSimpleCellAddress(address)) {
          this.addressMapping.removeCell(address)
          affectedSheets.add(address.sheet)
        }
      }
    }

    this.cleanupPlaceholderSheets(affectedSheets)
  }

  /**
   * Removes placeholder sheets that have no remaining vertices.
   */
  private cleanupPlaceholderSheets(sheetIds: Set<number>): void {
    for (const sheetId of sheetIds) {
      if (this.isPlaceholder(sheetId) &&
          !this.addressMapping.hasAnyEntries(sheetId) &&
          this.rangeMapping.getNumberOfRangesInSheet(sheetId) === 0) {
        this.sheetMapping.removeSheetIfExists(sheetId, { includePlaceholders: true })
        this.addressMapping.removeSheetIfExists(sheetId)
      }
    }
  }
}

export interface ArrayAffectingGraphChangeResult {
  affectedArrays: Set<ArrayFormulaVertex>,
}

export interface EagerChangesGraphChangeResult extends ArrayAffectingGraphChangeResult {
  contentChanges: ContentChanges,
}
