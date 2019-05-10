import {AddressMapping} from './AddressMapping'
import {CellRange, CellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {Matrix} from './Matrix'

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

  public static fromCooridinates(sheet: number, x1: number, y1: number, x2: number, y2: number): AbsoluteCellRange {
    return new AbsoluteCellRange(simpleCellAddress(sheet, x1, y1), simpleCellAddress(sheet, x2, y2))
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

  public get sheet() {
    return this.start.sheet
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

  public* generateCellsFromRangeGenerator() {
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

  public getAddress(col: number, row: number): SimpleCellAddress {
    if (col < 0 || row < 0 || row > this.height() - 1 || col > this.width() - 1) {
      throw Error('Index out of bound')
    }
    return simpleCellAddress(this.start.sheet, this.start.col + col, this.start.row + row)
  }

  public toMatrix(addressMapping: AddressMapping): Matrix {
    const values = new Array(this.height())
    for (let i = 0; i < this.height(); ++i) {
      values[i] = new Array(this.width())
    }
    for (const address of this.generateCellsFromRangeGenerator()) {
      const value = addressMapping.getCellValue(address)
      if (typeof value === 'number') {
        values[address.row][address.col] = value
      } else {
        throw new Error('Range contains not numeric values')
      }
    }

    return new Matrix(values)
  }
}
