import {CellRange, simpleCellAddress, SimpleCellAddress} from './Cell'
import {DependencyGraph} from './DependencyGraph'
import {AstNodeType, CellAddress, CellRangeAst} from './parser'
import {ColumnRangeAst} from './parser/Ast'

export const DIFFERENT_SHEETS_ERROR = 'AbsoluteCellRange: Start and end are in different sheets'

export class AbsoluteCellRange {
  public get sheet() {
    return this.start.sheet
  }

  public static fromAst(ast: CellRangeAst | ColumnRangeAst, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    if (ast.type === AstNodeType.CELL_RANGE) {
      return AbsoluteCellRange.fromCellRange(ast, baseAddress)
    } else if (ast.type === AstNodeType.COLUMN_RANGE) {
      return AbsoluteColumnRange.fromColumnRange(ast, baseAddress)
    }
    throw new Error('Unsupported AST type')
  }

  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(
      new CellAddress(x.start.sheet, x.start.col, x.start.row, x.start.type).toSimpleCellAddress(baseAddress),
      new CellAddress(x.end.sheet, x.end.col, x.end.row, x.end.type).toSimpleCellAddress(baseAddress),
    )
  }

  public static spanFrom(topLeftCorner: SimpleCellAddress, width: number, height: number): AbsoluteCellRange {
    return new AbsoluteCellRange(
      topLeftCorner,
      simpleCellAddress(topLeftCorner.sheet, topLeftCorner.col + width - 1, topLeftCorner.row + height - 1),
    )
  }

  public static fromCoordinates(sheet: number, x1: number, y1: number, x2: number, y2: number): AbsoluteCellRange {
    return new AbsoluteCellRange(simpleCellAddress(sheet, x1, y1), simpleCellAddress(sheet, x2, y2))
  }

  public static singleRangeFromCellAddress(cellAddress: CellAddress, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    const simpleCellAddress = cellAddress.toSimpleCellAddress(baseAddress)
    return new AbsoluteCellRange(simpleCellAddress, simpleCellAddress)
  }

  constructor(
    public readonly start: SimpleCellAddress,
    public readonly end: SimpleCellAddress,
  ) {
    if (start.sheet !== end.sheet) {
      throw new Error(DIFFERENT_SHEETS_ERROR)
    }
  }

  public doesOverlap(other: AbsoluteCellRange): boolean {
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

  public addressInRange(address: SimpleCellAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }

    if (this.start.row <= address.row && this.end.row >= address.row
        && this.start.col <= address.col && this.end.col >= address.col) {
      return true
    }

    return false
  }

  public containsRange(range: AbsoluteCellRange): boolean {
    return this.addressInRange(range.start) && this.addressInRange(range.end)
  }

  public intersectionWith(other: AbsoluteCellRange): AbsoluteCellRange | null {
    if (this.sheet !== other.start.sheet) {
      return null
    }
    const startRow = Math.max(this.start.row, other.start.row)
    const endRow = Math.min(this.end.row, other.end.row)
    const startCol = Math.max(this.start.col, other.start.col)
    const endCol = Math.min(this.end.col, other.end.col)
    if (startRow > endRow || startCol > endCol) {
      return null
    }

    return new AbsoluteCellRange(
      simpleCellAddress(this.sheet, startCol, startRow),
      simpleCellAddress(this.sheet, endCol, endRow),
    )
  }

  public includesRow(row: number): boolean {
    return this.start.row < row && this.end.row >= row
  }

  public includesColumn(column: number): boolean {
    return this.start.col < column && this.end.col >= column
  }

  public shiftByRows(numberOfRows: number) {
    this.start.row += numberOfRows
    this.end.row += numberOfRows
  }

  public expandByRows(numberOfRows: number) {
    this.end.row += numberOfRows
  }

  public shiftByColumns(numberOfColumns: number) {
    this.start.col += numberOfColumns
    this.end.col += numberOfColumns
  }

  public shifted(byCols: number, byRows: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.start.col + byCols, this.start.row + byRows), this.width(), this.height())
  }

  public expandByColumns(numberOfColumns: number) {
    this.end.col += numberOfColumns
  }

  public moveToSheet(toSheet: number) {
    this.start.sheet = toSheet
    this.end.sheet = toSheet
  }

  public removeRows(rowStart: number, rowEnd: number) {
    if (rowStart > this.end.row) {
      return
    }

    if (rowEnd < this.start.row) {
      return this.shiftByRows(-(rowEnd - rowStart + 1))
    }
    if (rowStart <= this.start.row) {
      this.start.row = rowStart
    }

    this.end.row -= Math.min(rowEnd, this.end.row) - rowStart + 1
  }

  public removeColumns(columnStart: number, columnEnd: number) {
    const numberOfColumns = columnEnd - columnStart + 1
    if (columnStart > this.end.col) {
      return
    }

    if (columnEnd < this.start.col) {
      this.shiftByColumns(-numberOfColumns)
      return
    }
    if (columnStart <= this.start.col) {
      this.start.col = columnStart
    }

    this.end.col -= Math.min(columnEnd, this.end.col) - columnStart + 1
  }

  public shouldBeRemoved(): boolean {
    return this.width() <= 0 || this.height() <= 0
  }

  public subrangeWithSameWidth(startRow: number, numberOfRows: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.start.col, startRow), this.width(), numberOfRows)
  }

  public subrangeWithSameHeight(startColumn: number, numebrOfColumns: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, startColumn, this.start.row), numebrOfColumns, this.height())
  }

  public toString(): string {
    return `${this.start.sheet},${this.start.col},${this.start.row},${this.end.col},${this.end.row}`
  }

  public width(): number {
    return this.end.col - this.start.col + 1
  }

  public height(): number {
    return this.end.row - this.start.row + 1
  }

  public size(): number {
    return this.height() * this.width()
  }

  public arrayOfAddressesInRange(): SimpleCellAddress[][] {
    const result: SimpleCellAddress[][] = []
    for (let y = 0; y < this.height(); ++y) {
      result[y] = []
      for (let x = 0; x < this.width(); ++x) {
        const value = simpleCellAddress(this.sheet, this.start.col + x, this.start.row + y)
        result[y].push(value)
      }
    }
    return result
  }

  public withStart(newStart: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(newStart, this.end)
  }

  public sameDimensionsAs(other: AbsoluteCellRange) {
    return this.width() === other.width() && this.height() === other.height()
  }

  public* addresses(dependencyGraph: DependencyGraph): IterableIterator<SimpleCellAddress> {
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

  public* addressesWithDirection(right: number, bottom: number): IterableIterator<SimpleCellAddress> {
    if (right > 0) {
      if (bottom > 0) {
        let currentRow = this.end.row
        while (currentRow >= this.start.row) {
          let currentColumn = this.end.col
          while (currentColumn >= this.start.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn -= 1
          }
          currentRow -= 1
        }
      } else {
        let currentRow = this.start.row
        while (currentRow <= this.end.row) {
          let currentColumn = this.end.col
          while (currentColumn >= this.start.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn -= 1
          }
          currentRow += 1
        }
      }
    } else {
      if (bottom > 0) {
        let currentRow = this.end.row
        while (currentRow >= this.start.row) {
          let currentColumn = this.start.col
          while (currentColumn <= this.end.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn += 1
          }
          currentRow -= 1
        }
      } else {
        let currentRow = this.start.row
        while (currentRow <= this.end.row) {
          let currentColumn = this.start.col
          while (currentColumn <= this.end.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn += 1
          }
          currentRow += 1
        }
      }
    }
  }

  public getAddress(col: number, row: number): SimpleCellAddress {
    if (col < 0 || row < 0 || row > this.height() - 1 || col > this.width() - 1) {
      throw Error('Index out of bound')
    }
    return simpleCellAddress(this.start.sheet, this.start.col + col, this.start.row + row)
  }
}

export class AbsoluteColumnRange extends AbsoluteCellRange {
  public static fromColumnRange(x: ColumnRangeAst, baseAddress: SimpleCellAddress): AbsoluteColumnRange {
    return new AbsoluteColumnRange(
      x.start.toSimpleAddress(baseAddress).start,
      x.end.toSimpleAddress(baseAddress).end,
    )
  }

  public constructor(
    public readonly start: SimpleCellAddress,
    public readonly end: SimpleCellAddress,
  ) {
    super(start, end)
  }

  public shouldBeRemoved() {
    return this.width() <= 0
  }

  private effectiveHeight(dependencyGraph: DependencyGraph): number {
    return dependencyGraph.getSheetHeight(this.sheet)
  }

  public shiftByRows(numberOfRows: number) {
    return
  }

  public expandByRows(numberOfRows: number) {
    return
  }

  public shifted(byCols: number, byRows: number): AbsoluteCellRange {
    return new AbsoluteColumnRange(simpleCellAddress(this.sheet, this.start.col + byCols, 0), simpleCellAddress(this.sheet, this.end.col + byCols, Number.POSITIVE_INFINITY))
  }

  public removeRows(rowStart: number, rowEnd: number) {
    return
  }

  public height(): number {
    return Number.POSITIVE_INFINITY
  }

  public size(): number {
    return Number.POSITIVE_INFINITY
  }

  public* addresses(dependencyGraph: DependencyGraph): IterableIterator<SimpleCellAddress> {
    let currentRow = 0
    while (currentRow <= this.effectiveHeight(dependencyGraph) - 1) {
      let currentColumn = this.start.col
      while (currentColumn <= this.end.col) {
        yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
        currentColumn++
      }
      currentRow++
    }
  }
}
