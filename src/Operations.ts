import {Statistics, StatType} from './statistics/Statistics'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {SimpleCellAddress} from './Cell'
import {RowsSpan} from './RowsSpan'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Index} from './HyperFormula'
import {DependencyGraph, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex,} from './DependencyGraph'
import {ParserWithCaching} from './parser'
import {AddRowsTransformer} from './dependencyTransformers/AddRowsTransformer'
import {RemoveColumnsTransformer} from './dependencyTransformers/RemoveColumnsTransformer'
import {RemoveRowsTransformer} from './dependencyTransformers/RemoveRowsTransformer'

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
  constructor(
    private readonly dependencyGraph: DependencyGraph,
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
    for (const [address, vertex] of this.dependencyGraph.entriesFromRowsSpan(rowsToRemove)) {
      removedCells.push({ address, cellType: this.getClipboardCell(address) })
    }

    this.dependencyGraph.removeRows(rowsToRemove)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveRowsTransformer(rowsToRemove)
      transformation.transform(this.dependencyGraph, this.parser)
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
      transformation.transform(this.dependencyGraph, this.parser)
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
