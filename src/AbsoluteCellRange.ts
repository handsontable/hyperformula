import {CellRange, getAbsoluteAddress, SimpleCellAddress} from './Cell'

export class AbsoluteCellRange {

  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(
      getAbsoluteAddress(x.start, baseAddress),
      getAbsoluteAddress(x.end, baseAddress),
    )
  }
  constructor(
    public readonly start: SimpleCellAddress,
    public readonly end: SimpleCellAddress,
  ) {
  }

  public width() {
    return this.end.col - this.start.col + 1
  }

  public height() {
    return this.end.row - this.start.row + 1
  }

  public doesOverlap(other: AbsoluteCellRange) {
    if (this.start.sheet != other.start.sheet) {
      return true
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
}
