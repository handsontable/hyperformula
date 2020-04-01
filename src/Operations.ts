/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Statistics, StatType} from './statistics'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {SimpleCellAddress, EmptyValue, simpleCellAddress, invalidSimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent, isMatrix} from './CellContentParser'
import {RowsSpan} from './RowsSpan'
import {ContentChanges} from './ContentChanges'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {absolutizeDependencies} from './absolutizeDependencies'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Index} from './HyperFormula'
import {buildMatrixVertex} from './GraphBuilder'
import {DependencyGraph, SheetMapping, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex, ParsingErrorVertex} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {InvalidAddressError, InvalidArgumentsError, NoSheetWithIdError, NoSheetWithNameError} from './errors'
import {ParserWithCaching, ProcedureAst} from './parser'
import {AddRowsTransformer} from './dependencyTransformers/AddRowsTransformer'
import {RemoveRowsTransformer} from './dependencyTransformers/RemoveRowsTransformer'
import {MoveCellsTransformer} from './dependencyTransformers/MoveCellsTransformer'
import {RemoveSheetTransformer} from './dependencyTransformers/RemoveSheetTransformer'
import {AbsoluteCellRange} from './AbsoluteCellRange'

export class RemoveRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
    return normalizeRemovedIndexes(this.indexes)
  }

  public rowsSpans(): RowsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      RowsSpan.fromNumberOfRows(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export class AddRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
    return normalizeAddedIndexes(this.indexes)
  }

  public rowsSpans(): RowsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      RowsSpan.fromNumberOfRows(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export interface ChangedCell {
  address: SimpleCellAddress,
  cellType: ClipboardCell,
}

export interface RowsRemoval {
  rowFrom: number,
  rowCount: number,
  version: number,
  removedCells: ChangedCell[],
}

export interface RowsAddition {
  afterRow: number,
  rowCount: number,
}

export class Operations {
  private changes: ContentChanges = ContentChanges.empty()

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly cellContentParser: CellContentParser,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  public removeRows(cmd: RemoveRowsCommand): RowsRemoval[] {
    const rowsRemovals: RowsRemoval[] = []
    for (const rowsToRemove of cmd.rowsSpans()) {
      const rowsRemoval = this.doRemoveRows(rowsToRemove)
      if (rowsRemoval) {
        rowsRemovals.push(rowsRemoval)
      }
    }
    return rowsRemovals
  }

  public addRows(cmd: AddRowsCommand): RowsAddition[] {
    const rowsAdditions: RowsAddition[] = []
    for (const addedRows of cmd.rowsSpans()) {
      const rowAddition = this.doAddRows(addedRows)
      if (rowAddition) {
        rowsAdditions.push(rowAddition)
      }
    }
    return rowsAdditions
  }

  public removeSheet(sheetName: string) {
    const sheetId = this.sheetMapping.fetch(sheetName)

    this.dependencyGraph.removeSheet(sheetId)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveSheetTransformer(sheetId)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.sheetMapping.removeSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
  }

  public clearSheet(sheetId: number) {
    this.dependencyGraph.clearSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
  }

  public addSheet(name?: string) {
    const sheetId = this.sheetMapping.addSheet(name)
    this.dependencyGraph.addressMapping.autoAddSheet(sheetId, [])
    return this.sheetMapping.fetchDisplayName(sheetId)
  }

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    const rowsToAdd = RowsSpan.fromNumberOfRows(sheet, targetRow, numberOfRows)
    this.doAddRows(rowsToAdd)

    if (targetRow < startRow) {
      startRow += numberOfRows
    }

    const startAddress = simpleCellAddress(sheet, 0, startRow)
    const targetAddress = simpleCellAddress(sheet, 0, targetRow)
    this.moveCells(startAddress, Number.POSITIVE_INFINITY, numberOfRows, targetAddress)
    const rowsToRemove = RowsSpan.fromNumberOfRows(sheet, startRow, numberOfRows)
    this.doRemoveRows(rowsToRemove)
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    this.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    this.dependencyGraph.breakNumericMatricesInRange(sourceRange)
    this.dependencyGraph.breakNumericMatricesInRange(targetRange)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    const valuesToRemove = this.dependencyGraph.valuesFromRange(targetRange)
    this.columnSearch.removeValues(valuesToRemove)
    const valuesToMove = this.dependencyGraph.valuesFromRange(sourceRange)
    this.columnSearch.moveValues(valuesToMove, toRight, toBottom, toSheet)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new MoveCellsTransformer(sourceRange, toRight, toBottom, toSheet)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)
  }

  public ensureItIsPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    if (
      invalidSimpleCellAddress(sourceLeftCorner) ||
      !((isPositiveInteger(width) && isPositiveInteger(height)) || isRowOrColumnRange(sourceLeftCorner, width, height)) ||
      invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.sheetMapping.hasSheetWithId(sourceLeftCorner.sheet) ||
      !this.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)
    ) {
      throw new InvalidArgumentsError()
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(targetRange)) {
      throw new Error('It is not possible to replace cells with matrix')
    }
  }

  public restoreCell(address: SimpleCellAddress, clipboardCell: ClipboardCell) {
    switch (clipboardCell.type) {
      case ClipboardCellType.VALUE: {
        this.setValueToCell(clipboardCell.value, address)
        break
      }
      case ClipboardCellType.FORMULA: {
        this.setFormulaToCellFromCache(clipboardCell.hash, address)
        break
      }
    }
  }

  /**
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   * */
  private doRemoveRows(rowsToRemove: RowsSpan): RowsRemoval | undefined {
    if (this.rowEffectivelyNotInSheet(rowsToRemove.rowStart, rowsToRemove.sheet)) {
      return
    }

    const removedCells: ChangedCell[] = []
    for (const [address] of this.dependencyGraph.entriesFromRowsSpan(rowsToRemove)) {
      removedCells.push({ address, cellType: this.getClipboardCell(address) })
    }

    this.dependencyGraph.removeRows(rowsToRemove)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveRowsTransformer(rowsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })
    return { version: version!, removedCells, rowFrom: rowsToRemove.rowStart, rowCount: rowsToRemove.numberOfRows }
  }

  /**
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id in which rows will be added
   * @param row - row number above which the rows will be added
   * @param numberOfRowsToAdd - number of rows to add
   */
  private doAddRows(addedRows: RowsSpan): RowsAddition | undefined {
    if (this.rowEffectivelyNotInSheet(addedRows.rowStart, addedRows.sheet)) {
      return
    }

    this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddRowsTransformer(addedRows)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    return { afterRow: addedRows.rowStart, rowCount: addedRows.numberOfRows }
  }

  private getClipboardCell(address: SimpleCellAddress): ClipboardCell {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === null || vertex instanceof EmptyCellVertex) {
      return { type: ClipboardCellType.EMPTY }
    } else if (vertex instanceof ValueCellVertex) {
      /* TODO should we copy errors? */
      return { type: ClipboardCellType.VALUE, value: vertex.getCellValue() }
    } else if (vertex instanceof MatrixVertex) {
      return { type: ClipboardCellType.VALUE, value: vertex.getMatrixCellValue(address) }
    } else if (vertex instanceof FormulaCellVertex) {
      return { type: ClipboardCellType.FORMULA, hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService)) }
    }

    throw Error('Trying to copy unsupported type')
  }

  public getSheetClipboardCells(sheet: number): ClipboardCell[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: ClipboardCell[][] = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        arr[i][j] = this.getClipboardCell(address)
      }
    }
    return arr
  }

  public setCellContent(address: SimpleCellAddress, newCellContent: RawCellContent): void {
    const parsedCellContent = this.cellContentParser.parse(newCellContent)

    let vertex = this.dependencyGraph.getCell(address)

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !(parsedCellContent instanceof CellContent.Number)) {
      this.dependencyGraph.breakNumericMatrix(vertex)
      vertex = this.dependencyGraph.getCell(address)
    }

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && parsedCellContent instanceof CellContent.Number) {
      const newValue = parsedCellContent.value
      const oldValue = this.dependencyGraph.getCellValue(address)
      this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(vertex)
      vertex.setMatrixCellValue(address, newValue)
      this.columnSearch.change(oldValue, newValue, address)
      this.changes.addChange(newValue, address)
    } else if (!(vertex instanceof MatrixVertex) && parsedCellContent instanceof CellContent.MatrixFormula) {
      const {ast, errors, dependencies} = this.parser.parse(parsedCellContent.formula, address)
      if (errors.length > 0) {
        this.dependencyGraph.setParsingErrorToCell(address, new ParsingErrorVertex(errors, parsedCellContent.formulaWithBraces()))
      } else {
        const newVertex = buildMatrixVertex(ast as ProcedureAst, address)
        if (newVertex instanceof ValueCellVertex) {
          throw Error('What if new matrix vertex is not properly constructed?')
        }
        this.dependencyGraph.addNewMatrixVertex(newVertex)
        this.dependencyGraph.processCellDependencies(absolutizeDependencies(dependencies, address), newVertex)
        this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(newVertex)
      }
    } else if (!(vertex instanceof MatrixVertex)) {
      if (parsedCellContent instanceof CellContent.Formula) {
        const {ast, errors, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
        if (errors.length > 0) {
          this.dependencyGraph.setParsingErrorToCell(address, new ParsingErrorVertex(errors, parsedCellContent.formula))
        } else {
          this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
        }
      } else if (parsedCellContent instanceof CellContent.Empty) {
        this.setCellEmpty(address)
      } else if (parsedCellContent instanceof CellContent.MatrixFormula) {
        throw new Error('Cant happen')
      } else {
        this.setValueToCell(parsedCellContent.value, address)
      }
    } else {
      throw new Error('Illegal operation')
    }
  }

  public setValueToCell(value: ValueCellVertexValue, address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    this.dependencyGraph.setValueToCell(address, value)
    this.columnSearch.change(oldValue, value, address)
    this.changes.addChange(value, address)
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    this.columnSearch.remove(oldValue, address)
    this.changes.addChange(EmptyValue, address)
    this.dependencyGraph.setCellEmpty(address)
  }

  public setFormulaToCellFromCache(formulaHash: string, address: SimpleCellAddress) {
    const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.fetchCachedResult(formulaHash)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param row - row number
   * @param sheet - sheet id number
   */
  public rowEffectivelyNotInSheet(row: number, sheet: number): boolean {
    const height = this.dependencyGraph.addressMapping.getHeight(sheet)
    return row >= height
  }

  public getAndClearContentChanges(): ContentChanges {
    const changes = this.changes
    this.changes = ContentChanges.empty()
    return changes
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }

  public forceApplyPostponedTransformations(): void {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }
}

export function normalizeRemovedIndexes(indexes: Index[]): Index[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = indexes.sort(([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0)

  /* merge overlapping and adjacent indexes */
  const merged = sorted.reduce((acc: Index[], [startIndex, amount]: Index) => {
    const previous = acc[acc.length - 1]
    const lastIndex = previous[0] + previous[1]

    if (startIndex <= lastIndex) {
      previous[1] += Math.max(0, amount - (lastIndex - startIndex))
    } else {
      acc.push([startIndex, amount])
    }

    return acc
  }, [sorted[0]])

  /* shift further indexes */
  let shift = 0
  for (let i = 0; i < merged.length; ++i) {
    merged[i][0] -= shift
    shift += merged[i][1]
  }

  return merged
}

export function normalizeAddedIndexes(indexes: Index[]): Index[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = indexes.sort(([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0)

  /* merge indexes with same start */
  const merged = sorted.reduce((acc: Index[], [startIndex, amount]: Index) => {
    const previous = acc[acc.length - 1]
    if (startIndex === previous[0]) {
      previous[1] = Math.max(previous[1], amount)
    } else {
      acc.push([startIndex, amount])
    }
    return acc
  }, [sorted[0]])

  /* shift further indexes */
  let shift = 0
  for (let i = 0; i < merged.length; ++i) {
    merged[i][0] += shift
    shift += merged[i][1]
  }

  return merged
}

function isPositiveInteger(x: number): boolean {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number): boolean {
  return Number.isInteger(x) && x >= 0
}
