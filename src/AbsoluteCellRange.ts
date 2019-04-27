import {CellRange, simpleCellAddress, SimpleCellAddress} from './Cell'

export const DIFFERENT_SHEETS_ERROR = 'AbsoluteCellRange: Start and end are in different sheets'

export class AbsoluteCellRange {

  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(x.start.toSimpleCellAddress(baseAddress), x.end.toSimpleCellAddress(baseAddress))
  }

  public static spanFrom(topLeftCorner: SimpleCellAddress, width: number, height: number): AbsoluteCellRange {
    return new AbsoluteCellRange(
      topLeftCorner,
      simpleCellAddress(topLeftCorner.sheet, topLeftCorner.col + width - 1, topLeftCorner.row + height - 1),
    )
  }

  constructor(
    public readonly start: SimpleCellAddress,
    public readonly end: SimpleCellAddress,
  ) {
    if (start.sheet !== end.sheet) {
      throw new Error(DIFFERENT_SHEETS_ERROR)
    }
  }

  public width() {
    return this.end.col - this.start.col + 1
  }

  public height() {
    return this.end.row - this.start.row + 1
  }

  public doesOverlap(other: AbsoluteCellRange) {
    if (this.start.sheet != other.start.sheet) {
      return false
    }
    if (this.end.row < other.start.row || this.start.row > other.end.row) {
      return false
    }
    if (this.end.col < other.start.col || this.start.col > other.end.col) {
      return false
    }
    return true
  }

  public withStart(newStart: SimpleCellAddress) {
    return new AbsoluteCellRange(newStart, this.end)
  }

  public withEnd(newEnd: SimpleCellAddress) {
    return new AbsoluteCellRange(this.start, newEnd)
  }

  public sameDimensionsAs(other: AbsoluteCellRange) {
    return this.width() === other.width() && this.height() === other.height()
  }

  public *generateCellsFromRangeGenerator() {
    let currentRow = this.start.row
    while (currentRow <= this.end.row) {
      let currentColumn = this.start.col
      while (currentColumn <= this.end.col) {
        yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
        currentColumn++
      }
      currentRow++
    }
  }
}
