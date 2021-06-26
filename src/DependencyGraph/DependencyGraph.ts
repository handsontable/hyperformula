/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, SimpleCellRange, simpleCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
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
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {MatrixSize} from '../MatrixSize'
import {Maybe} from '../Maybe'
import {NamedExpressions} from '../NamedExpressions'
import {Ast, collectDependencies, NamedExpressionDependency} from '../parser'
import {ColumnsSpan, RowsSpan, Span} from '../Span'
import {Statistics, StatType} from '../statistics'
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
import {collectAddressesDependentToRange} from './collectAddressesDependentToRange'
import {FormulaVertex} from './FormulaCellVertex'
import {Graph, TopSortResult} from './Graph'
import {MatrixMapping} from './MatrixMapping'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {RawAndParsedValue} from './ValueCellVertex'

export class DependencyGraph {
  /**
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

  private changes: ContentChanges = ContentChanges.empty()

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
    this.graph = new Graph<Vertex>(this.dependencyQueryVertices)
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency[], size: MatrixSize, hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean): ContentChanges {
    const newVertex = FormulaVertex.fromAst(ast, address, size, this.lazilyTransformingAstService.version())
    this.exchangeOrAddFormulaVertex(newVertex)
    this.processCellDependencies(dependencies, newVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
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
    const vertex = this.shrinkPossibleMatrixAndGetCell(address)
    this.exchangeOrAddGraphNode(vertex, errorVertex)
    this.addressMapping.setCell(address, errorVertex)
    this.graph.markNodeAsSpecialRecentlyChanged(errorVertex)
    this.correctInfiniteRangesDependency(address)
    return this.getAndClearContentChanges()
  }

  public setValueToCell(address: SimpleCellAddress, value: RawAndParsedValue): ContentChanges {
    const vertex = this.shrinkPossibleMatrixAndGetCell(address)

    if (vertex instanceof MatrixVertex) {
      this.matrixMapping.removeMatrix(vertex.getRange())
    }
    if (vertex instanceof ValueCellVertex) {
      const oldValues = vertex.getValues()
      if (oldValues.rawValue !== value.rawValue) {
        vertex.setValues(value)
        this.graph.markNodeAsSpecialRecentlyChanged(vertex)
      }
    } else {
      const newVertex = new ValueCellVertex(value.parsedValue, value.rawValue)
      this.exchangeOrAddGraphNode(vertex, newVertex)
      this.addressMapping.setCell(address, newVertex)
      this.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    }

    this.correctInfiniteRangesDependency(address)

    return this.getAndClearContentChanges()
  }

  public setCellEmpty(address: SimpleCellAddress): ContentChanges {
    const vertex = this.shrinkPossibleMatrixAndGetCell(address)
    if (vertex === undefined) {
      return ContentChanges.empty()
    }
    if (this.graph.adjacentNodes(vertex).size > 0) {
      const emptyVertex = new EmptyCellVertex(address)
      this.exchangeGraphNode(vertex, emptyVertex)
      if (this.graph.adjacentNodesCount(emptyVertex) === 0) {
        this.removeVertex(emptyVertex)
        this.addressMapping.removeCell(address)
      } else {
        this.graph.markNodeAsSpecialRecentlyChanged(emptyVertex)
        this.addressMapping.setCell(address, emptyVertex)
      }
    } else {
      this.removeVertex(vertex)
      this.addressMapping.removeCell(address)
    }

    return this.getAndClearContentChanges()
  }

  public ensureThatVertexIsNonMatrixCellVertex(vertex: Maybe<CellVertex>) {
    if (vertex instanceof MatrixVertex) {
      throw new Error('Illegal operation')
    }
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
        if (smallerRangeVertex !== undefined) {
          this.graph.addEdge(smallerRangeVertex, rangeVertex)
          if (rangeVertex.bruteForce) {
            rangeVertex.bruteForce = false
            for (const cellFromRange of range.addresses(this)) { //if we ever switch heuristic to processing by sorted sizes, this would be unnecessary
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

  public correctInfiniteRangesDependency(address: SimpleCellAddress) {
    let vertex: Maybe<Vertex> = undefined
    for (const range of this.graph.infiniteRanges) {
      const infiniteRangeVertex = (range as RangeVertex)
      if (infiniteRangeVertex.range.addressInRange(address)) {
        vertex = vertex ?? this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(vertex, infiniteRangeVertex)
      }
    }
  }

  public fetchCellOrCreateEmpty(address: SimpleCellAddress): CellVertex {
    let vertex = this.addressMapping.getCell(address)
    if (vertex === undefined) {
      vertex = new EmptyCellVertex(address)
      this.graph.addNode(vertex)
      this.addressMapping.setCell(address, vertex)
    }
    return vertex
  }

  public removeRows(removedRows: RowsSpan): RemoveRowsResult {
    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const [address, vertex] of this.addressMapping.entriesFromRowsSpan(removedRows)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
        }
        if (vertex instanceof MatrixVertex) {
          if (vertex.isLeftCorner(address)) {
            this.shrinkMatrixToCorner(vertex)
            this.matrixMapping.removeMatrix(vertex.getRange())
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
      return this.getMatrixVerticesRelatedToRanges(affectedRanges)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.fixMatricesAfterRemovingRows(removedRows.sheet, removedRows.rowStart, removedRows.numberOfRows)
    })

    this.addStructuralNodesToChangeSet()

    return {
      affectedArrays,
      contentChanges: this.getAndClearContentChanges()
    }
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
      this.removeVertex(vertex)
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
        this.removeVertex(range)
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

  public removeColumns(removedColumns: ColumnsSpan): [Set<MatrixVertex>, ContentChanges, [SimpleCellAddress, InterpreterValue][]]  {
    this.stats.measure(StatType.ADJUSTING_GRAPH, () => {
      for (const [address, vertex] of this.addressMapping.entriesFromColumnsSpan(removedColumns)) {
        for (const adjacentNode of this.graph.adjacentNodes(vertex)) {
          this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
        }
        if (vertex instanceof MatrixVertex) {
          if (vertex.isLeftCorner(address)) {
            this.shrinkMatrixToCorner(vertex)
            this.matrixMapping.removeMatrix(vertex.getRange())
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

    const affectedMatrices = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const affectedRanges = this.truncateRanges(removedColumns, address => address.col)
      return this.getMatrixVerticesRelatedToRanges(affectedRanges)
    })

    const valuesToUdpateInIndex = this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      return this.fixMatricesAfterRemovingColumns(removedColumns.sheet, removedColumns.columnStart, removedColumns.numberOfColumns)
    })

    this.addStructuralNodesToChangeSet()

    return [affectedMatrices, this.getAndClearContentChanges(), valuesToUdpateInIndex]
  }

  public addRows(addedRows: RowsSpan): AddRowsResult {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    const affectedArrays = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const result = this.rangeMapping.moveAllRangesInSheetAfterRowByRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
      this.fixRangesWhenAddingRows(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
      return this.getMatrixVerticesRelatedToRanges(result.verticesWithChangedSize)
    })

    this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      this.fixMatricesAfterAddingRow(addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)
    })

    for (const vertex of this.addressMapping.verticesFromRowsSpan(addedRows)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()

    return {affectedArrays}
  }

  public addColumns(addedColumns: ColumnsSpan): [Set<MatrixVertex>, [SimpleCellAddress, InterpreterValue][]] {
    this.stats.measure(StatType.ADJUSTING_ADDRESS_MAPPING, () => {
      this.addressMapping.addColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    const affectedMatrices = this.stats.measure(StatType.ADJUSTING_RANGES, () => {
      const result = this.rangeMapping.moveAllRangesInSheetAfterColumnByColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
      this.fixRangesWhenAddingColumns(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
      return this.getMatrixVerticesRelatedToRanges(result.verticesWithChangedSize)
    })

    const valuesToRemoveFromIndex = this.stats.measure(StatType.ADJUSTING_MATRIX_MAPPING, () => {
      return this.fixMatricesAfterAddingColumn(addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)
    })

    for (const vertex of this.addressMapping.verticesFromColumnsSpan(addedColumns)) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }

    this.addStructuralNodesToChangeSet()

    return [affectedMatrices, valuesToRemoveFromIndex]
  }

  public ensureNoMatrixInRange(range: AbsoluteCellRange) {
    if (this.matrixMapping.isFormulaMatrixInRange(range)) {
      throw Error('It is not possible to move / replace cells with matrix')
    }
  }

  public isThereSpaceForMatrix(matrixVertex: MatrixVertex): boolean {
    for (const address of matrixVertex.getRange().addresses(this)) {
      const vertexUnderAddress = this.addressMapping.getCell(address)
      if (vertexUnderAddress !== undefined && !(vertexUnderAddress instanceof EmptyCellVertex) && vertexUnderAddress !== matrixVertex) {
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
        this.graph.markNodeAsSpecialRecentlyChanged(sourceVertex)
        this.addressMapping.setCell(targetAddress, sourceVertex)
        let emptyVertex = undefined
        for (const adjacentNode of this.graph.adjacentNodes(sourceVertex)) {
          if (adjacentNode instanceof RangeVertex && !sourceRange.containsRange(adjacentNode.range)) {
            emptyVertex = emptyVertex ?? this.fetchCellOrCreateEmpty(sourceAddress)
            this.graph.addEdge(emptyVertex, adjacentNode)
            this.graph.removeEdge(sourceVertex, adjacentNode)
          }
        }
        if (emptyVertex) {
          this.graph.markNodeAsSpecialRecentlyChanged(emptyVertex)
          this.addressMapping.setCell(sourceAddress, emptyVertex)
        }
      }

      if (targetVertex !== undefined) {
        if (sourceVertex === undefined) {
          this.addressMapping.removeCell(targetAddress)
        }
        for (const adjacentNode of this.graph.adjacentNodes(targetVertex)) {
          sourceVertex = sourceVertex ?? this.fetchCellOrCreateEmpty(targetAddress)
          this.graph.addEdge(sourceVertex, adjacentNode)
          this.graph.markNodeAsSpecialRecentlyChanged(sourceVertex)
        }
        this.removeVertex(targetVertex)
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

  public setMatrixEmpty(matrixVertex: MatrixVertex) {
    const matrixRange = AbsoluteCellRange.spanFrom(matrixVertex.getAddress(this.lazilyTransformingAstService), matrixVertex.width, matrixVertex.height)
    const adjacentNodes = this.graph.adjacentNodes(matrixVertex)

    for (const address of matrixRange.addresses(this)) {
      this.addressMapping.removeCell(address)
    }

    for (const adjacentNode of adjacentNodes.values()) {
      const nodeDependencies = collectAddressesDependentToRange(this.functionRegistry, adjacentNode, matrixVertex.getRange(), this.lazilyTransformingAstService, this)
      for (const address of nodeDependencies) {
        const vertex = this.fetchCellOrCreateEmpty(address)
        this.graph.addEdge(vertex, adjacentNode)
      }
      if (nodeDependencies.length > 0) {
        this.graph.markNodeAsSpecialRecentlyChanged(adjacentNode)
      }
    }

    this.removeVertex(matrixVertex)
    this.matrixMapping.removeMatrix(matrixVertex.getRange())
  }

  public addVertex(address: SimpleCellAddress, vertex: CellVertex): void {
    this.graph.addNode(vertex)
    this.addressMapping.setCell(address, vertex)
  }

  public addMatrixVertex(address: SimpleCellAddress, vertex: MatrixVertex): void {
    this.graph.addNode(vertex)
    this.setAddressMappingForMatrixVertex(vertex, address)
  }

  public* matrixFormulaNodes(): IterableIterator<MatrixVertex> {
    for (const vertex of this.graph.nodes) {
      if (vertex instanceof MatrixVertex) {
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

  public getCell(address: SimpleCellAddress): Maybe<CellVertex> {
    return this.addressMapping.getCell(address)
  }

  public getCellValue(address: SimpleCellAddress): InterpreterValue {
    return this.addressMapping.getCellValue(address)
  }

  public getRawValue(address: SimpleCellAddress): RawCellContent {
    return this.addressMapping.getRawValue(address)
  }

  public getScalarValue(address: SimpleCellAddress): InternalScalarValue {
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
    return this.sheetMapping.fetch(sheetName)
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

  public getMatrixVerticesRelatedToRanges(ranges: RangeVertex[]): Set<MatrixVertex> {
    const matrixVertices = ranges.map(range => {
      if (this.graph.hasNode(range)) {
        return Array.from(this.graph.adjacentNodes(range)).filter(node => node instanceof MatrixVertex)
      } else {
        return []
      }
    }) as MatrixVertex[][]
    return new Set(...matrixVertices)
  }

  public* rawValuesFromRange(range: AbsoluteCellRange): IterableIterator<[RawScalarValue, SimpleCellAddress]> {
    for (const address of range.addresses(this)) {
      const value = this.getScalarValue(address)
      if (value !== EmptyValue) {
        yield [getRawValue(value), address]
      }
    }
  }

  public* entriesFromRange(range: AbsoluteCellRange): IterableIterator<[SimpleCellAddress, Maybe<CellVertex>]> {
    for (const address of range.addresses(this)) {
      yield [address, this.getCell(address)]
    }
  }

  public exchangeGraphNode(oldNode: Vertex, newNode: Vertex) {
    this.graph.addNode(newNode)
    const adjNodesStored = this.graph.adjacentNodes(oldNode)
    this.removeVertex(oldNode)
    adjNodesStored.forEach((adjacentNode) => {
      if (this.graph.hasNode(adjacentNode)) {
        this.graph.addEdge(newNode, adjacentNode)
      }
    })
  }

  public exchangeOrAddGraphNode(oldNode: Maybe<Vertex>, newNode: Vertex) {
    if (oldNode) {
      this.exchangeGraphNode(oldNode, newNode)
    } else {
      this.graph.addNode(newNode)
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

  public dependencyQueryVertices: (vertex: Vertex) => Vertex[] = (vertex: Vertex) => {
    if (vertex instanceof RangeVertex) {
      return this.rangeDependencyQuery(vertex).map(([_, v]) => v)
    } else {
      const dependenciesResult = this.formulaDependencyQuery(vertex)
      if (dependenciesResult !== undefined) {
        const [address, dependencies] = dependenciesResult
        return dependencies.map((dependency: CellDependency) => {
          if (dependency instanceof AbsoluteCellRange) {
            return this.rangeMapping.fetchRange(dependency.start, dependency.end)
          } else if (dependency instanceof NamedExpressionDependency) {
            const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(dependency.name, address.sheet)
            return this.addressMapping.fetchCell(namedExpression.address)
          } else {
            return this.addressMapping.fetchCell(dependency)
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

  public shrinkMatrixToCorner(matrix: MatrixVertex) {
    this.cleanAddressMappingUnderMatrix(matrix)
    for (const adjacentVertex of this.adjacentMatrixVertices(matrix)) {
      let relevantDependencies
      if (adjacentVertex instanceof FormulaVertex) {
        relevantDependencies = this.formulaDirectDependenciesToMatrix(adjacentVertex, matrix)
      } else {
        relevantDependencies = this.rangeDirectDependenciesToMatrix(adjacentVertex, matrix)
      }
      let dependentToCorner = false
      for (const [address, vertex] of relevantDependencies) {
        if (matrix.isLeftCorner(address)) {
          dependentToCorner = true
        }
        this.graph.addEdge(vertex, adjacentVertex)
        this.graph.markNodeAsSpecialRecentlyChanged(vertex)
      }
      if (!dependentToCorner) {
        this.graph.removeEdge(matrix, adjacentVertex)
      }
    }
    this.graph.markNodeAsSpecialRecentlyChanged(matrix)
  }

  public isArrayInternalCell(address: SimpleCellAddress): boolean {
    const vertex = this.getCell(address)
    return vertex instanceof MatrixVertex && !vertex.isLeftCorner(address)
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
      const castVertex = vertex as RangeVertex | FormulaCellVertex | MatrixVertex
      if (castVertex instanceof RangeVertex) {
        ret.push(simpleCellRange(castVertex.start, castVertex.end))
      } else {
        ret.push(castVertex.getAddress(this.lazilyTransformingAstService))
      }
    })
    return ret
  }

  private correctInfiniteRangesDependenciesByRangeVertex(vertex: RangeVertex) {
    for (const range of this.graph.infiniteRanges) {
      const infiniteRangeVertex = (range as RangeVertex)
      const intersection = vertex.range.intersectionWith(infiniteRangeVertex.range)
      if (intersection === undefined) {
        continue
      }
      for (const address of intersection.addresses(this)) {
        this.graph.addEdge(this.fetchCellOrCreateEmpty(address), range)
      }
    }
  }

  private cleanAddressMappingUnderMatrix(vertex: MatrixVertex) {
    const matrixRange = vertex.getRange()
    for (const address of matrixRange.addresses(this)) {
      const oldValue = vertex.getMatrixCellValue(address)
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

  private* formulaDirectDependenciesToMatrix(vertex: FormulaVertex, matrix: MatrixVertex): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const [, formulaDependencies] = this.formulaDependencyQuery(vertex) ?? []
    if (formulaDependencies === undefined) {
      return
    }
    for (const dependency of formulaDependencies) {
      if (dependency instanceof NamedExpressionDependency || dependency instanceof AbsoluteCellRange) {
        continue
      }
      if (matrix.getRange().addressInRange(dependency)) {
        const vertex = this.fetchCellOrCreateEmpty(dependency)
        yield [dependency, vertex]
      }
    }
  }

  private* rangeDirectDependenciesToMatrix(vertex: RangeVertex, matrix: MatrixVertex): IterableIterator<[SimpleCellAddress, CellVertex]> {
    const {restRange: range} = this.rangeMapping.findSmallerRange(vertex.range)
    for (const address of range.addresses(this)) {
      if (matrix.getRange().addressInRange(address)) {
        const cell = this.fetchCellOrCreateEmpty(address)
        yield [address, cell]
      }
    }
  }

  private* adjacentMatrixVertices(vertex: MatrixVertex): IterableIterator<FormulaVertex | RangeVertex> {
    const adjacentNodes = this.graph.adjacentNodes(vertex)
    for (const item of adjacentNodes) {
      if (item instanceof FormulaVertex || item instanceof RangeVertex) {
        yield item
      }
    }
  }

  private rangeDependencyQuery = (vertex: RangeVertex) => {
    const allDeps: [(SimpleCellAddress | AbsoluteCellRange), Vertex][] = []
    const {smallerRangeVertex, restRange} = this.rangeMapping.findSmallerRange(vertex.range) //checking whether this range was splitted by bruteForce or not
    let range
    if (smallerRangeVertex !== undefined && this.graph.adjacentNodes(smallerRangeVertex).has(vertex)) {
      range = restRange
      allDeps.push([new AbsoluteCellRange(smallerRangeVertex.start, smallerRangeVertex.end), smallerRangeVertex])
    } else { //did we ever need to use full range
      range = vertex.range
    }
    for (const address of range.addresses(this)) {
      const cell = this.addressMapping.getCell(address)
      if (cell instanceof EmptyCellVertex) {
        cell.address = address
      }
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

  private addStructuralNodesToChangeSet() {
    for (const vertex of this.graph.specialNodesStructuralChanges) {
      this.graph.markNodeAsSpecialRecentlyChanged(vertex)
    }
  }

  private fixRangesWhenAddingRows(sheet: number, row: number, numberOfRows: number): void {
    const originalValues: RangeVertex[] = Array.from(this.rangeMapping.rangesInSheet(sheet))
    for (const rangeVertex of originalValues) {
      if (rangeVertex.range.includesRow(row + numberOfRows)) {
        if (rangeVertex.bruteForce) {
          const addedSubrangeInThatRange = rangeVertex.range.rangeWithSameWidth(row, numberOfRows)
          for (const address of addedSubrangeInThatRange.addresses(this)) {
            this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
          }
        } else {
          let currentRangeVertex = rangeVertex
          let find = this.rangeMapping.findSmallerRange(currentRangeVertex.range)
          if (find.smallerRangeVertex !== undefined) {
            continue
          }
          while (find.smallerRangeVertex === undefined) {
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
    for (const address of range.addresses(this)) {
      this.graph.addEdge(this.fetchCellOrCreateEmpty(address), vertex)
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
          this.graph.addEdge(this.fetchCellOrCreateEmpty(address), rangeVertex)
        }
      }
    }
  }

  private exchangeOrAddFormulaVertex(vertex: FormulaVertex): void {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    const range = AbsoluteCellRange.spanFrom(address, vertex.width, vertex.height)
    const oldNode = this.shrinkPossibleMatrixAndGetCell(address)
    if (vertex instanceof MatrixVertex) {
      this.setMatrix(range, vertex)
    }
    this.exchangeOrAddGraphNode(oldNode, vertex)
    this.addressMapping.setCell(address, vertex)

    if (vertex instanceof MatrixVertex) {
      if (!this.isThereSpaceForMatrix(vertex)) {
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

  private setAddressMappingForMatrixVertex(vertex: CellVertex, formulaAddress: SimpleCellAddress): void {
    this.addressMapping.setCell(formulaAddress, vertex)

    if (!(vertex instanceof MatrixVertex)) {
      return
    }

    const range = AbsoluteCellRange.spanFrom(formulaAddress, vertex.width, vertex.height)
    this.setMatrix(range, vertex)

    if (!this.isThereSpaceForMatrix(vertex)) {
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
      this.mergeRangeVertices(existingVertex, mergedVertex)
    }
    for (const rangeVertex of verticesToRemove) {
      this.removeVertexAndCleanupDependencies(rangeVertex)
    }
    return verticesWithChangedSize
  }

  private fixMatricesAfterAddingRow(sheet: number, rowStart: number, numberOfRows: number) {
    this.matrixMapping.moveMatrixVerticesAfterRowByRows(sheet, rowStart, numberOfRows)
    if (rowStart <= 0) {
      return
    }
    for (const [, matrix] of this.matrixMapping.matricesInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart - 1, rowStart - 1))) {
      const matrixRange = matrix.getRange()
      for (let col = matrixRange.start.col; col <= matrixRange.end.col; ++col) {
        for (let row = rowStart; row <= matrixRange.end.row; ++row) {
          const destination = simpleCellAddress(sheet, col, row)
          const source = simpleCellAddress(sheet, col, row + numberOfRows)
          this.addressMapping.moveCell(source, destination)
        }
      }
    }
  }

  private fixMatricesAfterRemovingRows(sheet: number, rowStart: number, numberOfRows: number) {
    this.matrixMapping.moveMatrixVerticesAfterRowByRows(sheet, rowStart, -numberOfRows)
    if (rowStart <= 0) {
      return
    }
    for (const [, matrix] of this.matrixMapping.matricesInRows(RowsSpan.fromRowStartAndEnd(sheet, rowStart - 1, rowStart - 1))) {
      if (this.isThereSpaceForMatrix(matrix)) {
        for (const address of matrix.getRange().addresses(this)) {
          this.addressMapping.setCell(address, matrix)
        }
      } else {
        this.setNoSpaceIfMatrix(matrix)
      }
    }
  }


  private fixMatricesAfterAddingColumn(sheet: number, columnStart: number, numberOfColumns: number): [SimpleCellAddress, InterpreterValue][] {
    const valuesToRemoveFromIndex: [SimpleCellAddress, InterpreterValue][] = []
    this.matrixMapping.moveMatrixVerticesAfterColumnByColumns(sheet, columnStart, numberOfColumns)
    if (columnStart <= 0) {
      return []
    }
    for (const [, matrix] of this.matrixMapping.matricesInCols(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart - 1, columnStart - 1))) {
      const matrixRange = matrix.getRange()
      for (let row = matrixRange.start.row; row <= matrixRange.end.row; ++row) {
        for (let col = columnStart; col <= matrixRange.end.col; ++col) {
          const destination = simpleCellAddress(sheet, col, row)
          const source = simpleCellAddress(sheet, col + numberOfColumns, row)
          const value = matrix.getMatrixCellValue(destination)
          this.addressMapping.moveCell(source, destination)
          valuesToRemoveFromIndex.push([source, value])
        }
      }
    }
    return valuesToRemoveFromIndex
  }

  private fixMatricesAfterRemovingColumns(sheet: number, columnStart: number, numberOfColumns: number): [SimpleCellAddress, InterpreterValue][] {
    const valuesToUpdateInIndex: [SimpleCellAddress, InterpreterValue][] = []
    this.matrixMapping.moveMatrixVerticesAfterColumnByColumns(sheet, columnStart, -numberOfColumns)
    if (columnStart <= 0) {
      return []
    }
    for (const [, matrix] of this.matrixMapping.matricesInCols(ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart - 1, columnStart - 1))) {
      if (this.isThereSpaceForMatrix(matrix)) {
        for (const address of matrix.getRange().addresses(this)) {
          const value = matrix.getMatrixCellValue(address)
          valuesToUpdateInIndex.push([address, value])
          this.addressMapping.setCell(address, matrix)
        }
      } else {
        this.setNoSpaceIfMatrix(matrix)
      }
    }
    return valuesToUpdateInIndex
  }

  private shrinkPossibleMatrixAndGetCell(address: SimpleCellAddress): Maybe<CellVertex> {
    const vertex = this.getCell(address)
    if (!(vertex instanceof MatrixVertex)) {
      return vertex
    }
    this.setNoSpaceIfMatrix(vertex)
    return this.getCell(address)
  }

  private setNoSpaceIfMatrix(vertex: Maybe<Vertex>) {
    if (vertex instanceof MatrixVertex) {
      this.shrinkMatrixToCorner(vertex)
      vertex.setNoSpace()
    }
  }

  private removeVertex(vertex: Vertex) {
    this.removeVertexAndCleanupDependencies(vertex)
    if (vertex instanceof RangeVertex) {
      this.rangeMapping.removeRange(vertex)
    }
  }

  private mergeRangeVertices(existingVertex: RangeVertex, newVertex: RangeVertex) {
    const adjNodesStored = this.graph.adjacentNodes(newVertex)

    this.removeVertexAndCleanupDependencies(newVertex)
    this.graph.softRemoveEdge(existingVertex, newVertex)
    adjNodesStored.forEach((adjacentNode) => {
      if (this.graph.hasNode(adjacentNode)) {
        this.graph.addEdge(existingVertex, adjacentNode)
      }
    })
  }

  private removeVertexAndCleanupDependencies(inputVertex: Vertex) {
    const dependencies = new Set(this.graph.removeNode(inputVertex))
    while (dependencies.size > 0) {
      const vertex: Vertex = dependencies.values().next().value
      dependencies.delete(vertex)
      if (this.graph.hasNode(vertex) && this.graph.adjacentNodesCount(vertex) === 0) {
        if (vertex instanceof RangeVertex || vertex instanceof EmptyCellVertex) {
          this.graph.removeNode(vertex).forEach((candidate) => dependencies.add(candidate))
        }
        if (vertex instanceof RangeVertex) {
          this.rangeMapping.removeRange(vertex)
        } else if (vertex instanceof EmptyCellVertex) {
          this.addressMapping.removeCell(vertex.address)
        }
      }
    }
  }
}

export interface AddRowsResult {
  affectedArrays: Set<MatrixVertex>,
}

export interface RemoveRowsResult {
  affectedArrays: Set<MatrixVertex>,
  contentChanges: ContentChanges,
}
