import {AbsoluteCellRange} from './AbsoluteCellRange'
import {simpleCellAddress} from './Cell'

/*
 * A class representing a set of columns in specific sheet
 */
export class ColumnsSpan {
  constructor(
    public readonly sheet: number,
    public readonly columnStart: number,
    public readonly columnEnd: number,
  ) {
    if (columnStart < 0) {
      throw Error("Starting column cant be less than 0")
    }
    if (columnEnd < columnStart) {
      throw Error("Column span cant end before start")
    }
  }

  public get numberOfColumns() {
    return this.columnEnd - this.columnStart + 1
  }

  public* columns(): IterableIterator<number> {
    for (let col = this.columnStart; col <= this.columnEnd; ++col) {
      yield col
    }
  }

  public rangeFromTopTo(endRow: number) {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.columnStart, 0), this.numberOfColumns, endRow)
  }

  public intersect(otherSpan: ColumnsSpan): ColumnsSpan | null {
    if (this.sheet !== otherSpan.sheet) {
      throw Error("Can't intersect spans from different sheets")
    }
    const start = Math.max(this.columnStart, otherSpan.columnStart)
    const end = Math.min(this.columnEnd, otherSpan.columnEnd)
    if (start > end) {
      return null
    }
    return new ColumnsSpan(this.sheet, start, end)
  }
}
