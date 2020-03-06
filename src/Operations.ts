import {Statistics, StatType} from './statistics/Statistics'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {EmptyValue, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {RowsSpan} from './RowsSpan'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Index} from './HyperFormula'
import {
  AddressMapping, CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  SheetMapping,
  ValueCellVertex,
  Vertex,
} from './DependencyGraph'
import {ParserWithCaching} from './parser'
import {RemoveRowsDependencyTransformer} from './dependencyTransformers/removeRows'

export class RemoveRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes() {
    return normalizeRemovedIndexes(this.indexes)
  }
}

export interface RemovedCell {
  address: SimpleCellAddress,
  cellType: ClipboardCell,
}

export interface RowsRemoval {
  rowFrom: number,
  rowCount: number,
  version: number,
  removedCells: RemovedCell[]
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
    for (const index of cmd.normalizedIndexes()) {
      const rowsRemoval = this.doRemoveRows(cmd.sheet, index[0], index[0] + index[1] - 1)
      if (rowsRemoval) {
        rowsRemovals.push(rowsRemoval)
      }
    }
    return rowsRemovals
  }

  /**
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   * */
  private doRemoveRows(sheet: number, rowStart: number, rowEnd: number = rowStart): RowsRemoval | undefined {
    if (this.rowEffectivelyNotInSheet(rowStart, sheet) || rowEnd < rowStart) {
      return
    }

    const removedRows = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

    const removedCells: RemovedCell[] = []
    for (const [address, vertex] of this.dependencyGraph.addressMapping.entriesFromRowsSpan(removedRows)) {
      removedCells.push({ address, cellType: this.getClipboardCell(address) })
    }

    this.dependencyGraph.removeRows(removedRows)

    let version : number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveRowsDependencyTransformer.transform(removedRows, this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addRemoveRowsTransformation(removedRows)
    })
    return { version: version!, removedCells, rowFrom: rowStart, rowCount: rowEnd - rowStart + 1 }
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
