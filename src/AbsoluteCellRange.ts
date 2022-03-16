/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {
  CellRange,
  equalSimpleCellAddress,
  isSimpleCellAddress,
  simpleCellAddress,
  SimpleCellAddress,
  SimpleColumnAddress,
  SimpleRowAddress
} from './Cell'
import {DependencyGraph} from './DependencyGraph'
import {SheetsNotEqual} from './errors'
import {Maybe} from './Maybe'
import {AstNodeType, CellRangeAst} from './parser'
import {ColumnRangeAst, RowRangeAst} from './parser/Ast'
import {RowsSpan, Span} from './Span'

export const WRONG_RANGE_SIZE = 'AbsoluteCellRange: Wrong range size'

export interface SimpleCellRange {
  start: SimpleCellAddress,
  end: SimpleCellAddress,
}

export function isSimpleCellRange(obj: any): obj is SimpleCellRange {
  if (obj && (typeof obj === 'object' || typeof obj === 'function')) {
    return 'start' in obj && isSimpleCellAddress(obj.start) && 'end' in obj && isSimpleCellAddress(obj.end)
  } else {
    return false
  }
}

export const simpleCellRange = (start: SimpleCellAddress, end: SimpleCellAddress) => ({start, end})

export class AbsoluteCellRange implements SimpleCellRange {
  public readonly start: SimpleCellAddress
  public readonly end: SimpleCellAddress

  constructor(
    start: SimpleCellAddress,
    end: SimpleCellAddress,
  ) {
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }
    this.start = simpleCellAddress(start.sheet, start.col, start.row)
    this.end = simpleCellAddress(end.sheet, end.col, end.row)
  }

  public get sheet() {
    return this.start.sheet
  }

  public static fromAst(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    if (ast.type === AstNodeType.CELL_RANGE) {
      return AbsoluteCellRange.fromCellRange(ast, baseAddress)
    } else if (ast.type === AstNodeType.COLUMN_RANGE) {
      return AbsoluteColumnRange.fromColumnRange(ast, baseAddress)
    } else {
      return AbsoluteRowRange.fromRowRangeAst(ast, baseAddress)
    }
  }

  public static fromAstOrUndef(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, baseAddress: SimpleCellAddress): Maybe<AbsoluteCellRange> {
    try {
      return AbsoluteCellRange.fromAst(ast, baseAddress)
    } catch (_e) {
      return undefined
    }
  }

  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(
      x.start.toSimpleCellAddress(baseAddress),
      x.end.toSimpleCellAddress(baseAddress),
    )
  }

  public static spanFrom(topLeftCorner: SimpleCellAddress, width: number, height: number): AbsoluteCellRange {
    const ret = AbsoluteCellRange.spanFromOrUndef(topLeftCorner, width, height)
    if (ret === undefined) {
      throw new Error(WRONG_RANGE_SIZE)
    }
    return ret
  }

  public static spanFromOrUndef(topLeftCorner: SimpleCellAddress, width: number, height: number): Maybe<AbsoluteCellRange> {
    if (!Number.isFinite(width) && Number.isFinite(height)) {
      if (topLeftCorner.col !== 0) {
        return undefined
      }
      return new AbsoluteRowRange(topLeftCorner.sheet, topLeftCorner.row, topLeftCorner.row + height - 1)
    } else if (!Number.isFinite(height) && Number.isFinite(width)) {
      if (topLeftCorner.row !== 0) {
        return undefined
      }
      return new AbsoluteColumnRange(topLeftCorner.sheet, topLeftCorner.col, topLeftCorner.col + width - 1)
    } else if (Number.isFinite(height) && Number.isFinite(width)) {
      return new AbsoluteCellRange(
        topLeftCorner,
        simpleCellAddress(topLeftCorner.sheet, topLeftCorner.col + width - 1, topLeftCorner.row + height - 1),
      )
    }
    return undefined
  }

  public static fromCoordinates(sheet: number, x1: number, y1: number, x2: number, y2: number): AbsoluteCellRange {
    return new AbsoluteCellRange(simpleCellAddress(sheet, x1, y1), simpleCellAddress(sheet, x2, y2))
  }

  public isFinite(): boolean {
    return Number.isFinite(this.size())
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

    return this.start.row <= address.row
      && this.end.row >= address.row
      && this.start.col <= address.col
      && this.end.col >= address.col
  }

  public columnInRange(address: SimpleColumnAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }
    return this.start.col <= address.col && this.end.col >= address.col
  }

  public rowInRange(address: SimpleRowAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }
    return this.start.row <= address.row && this.end.row >= address.row
  }

  public containsRange(range: AbsoluteCellRange): boolean {
    return this.addressInRange(range.start) && this.addressInRange(range.end)
  }

  public intersectionWith(other: AbsoluteCellRange): Maybe<AbsoluteCellRange> {
    if (this.sheet !== other.start.sheet) {
      return undefined
    }
    const startRow = Math.max(this.start.row, other.start.row)
    const endRow = Math.min(this.end.row, other.end.row)
    const startCol = Math.max(this.start.col, other.start.col)
    const endCol = Math.min(this.end.col, other.end.col)
    if (startRow > endRow || startCol > endCol) {
      return undefined
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

  public removeSpan(span: Span) {
    if (span instanceof RowsSpan) {
      this.removeRows(span.start, span.end)
    } else {
      this.removeColumns(span.start, span.end)
    }
  }

  public shouldBeRemoved(): boolean {
    return this.width() <= 0 || this.height() <= 0
  }

  public rangeWithSameWidth(startRow: number, numberOfRows: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.start.col, startRow), this.width(), numberOfRows)
  }

  public rangeWithSameHeight(startColumn: number, numberOfColumns: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, startColumn, this.start.row), numberOfColumns, this.height())
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

  public sameAs(other: AbsoluteCellRange) {
    return equalSimpleCellAddress(this.start, other.start) && equalSimpleCellAddress(this.end, other.end)
  }

  public addressesArrayMap<T>(dependencyGraph: DependencyGraph, op: (arg: SimpleCellAddress) => T): T[][] {
    const ret = []
    let currentRow = this.start.row
    while (currentRow <= this.effectiveEndRow(dependencyGraph)) {
      let currentColumn = this.start.col
      const tmp = []
      while (currentColumn <= this.effectiveEndColumn(dependencyGraph)) {
        tmp.push(op(simpleCellAddress(this.start.sheet, currentColumn, currentRow)))
        currentColumn++
      }
      ret.push(tmp)
      currentRow++
    }
    return ret
  }

  public addresses(dependencyGraph: DependencyGraph): SimpleCellAddress[] {
    const ret = []
    let currentRow = this.start.row
    const limitRow = this.effectiveEndRow(dependencyGraph)
    const limitColumn = this.effectiveEndColumn(dependencyGraph)
    while (currentRow <= limitRow) {
      let currentColumn = this.start.col
      while (currentColumn <= limitColumn) {
        ret.push(simpleCellAddress(this.start.sheet, currentColumn, currentRow))
        currentColumn++
      }
      currentRow++
    }
    return ret
  }

  public* addressesWithDirection(right: number, bottom: number, dependencyGraph: DependencyGraph): IterableIterator<SimpleCellAddress> {
    if (right > 0) {
      if (bottom > 0) {
        let currentRow = this.effectiveEndRow(dependencyGraph)
        while (currentRow >= this.start.row) {
          let currentColumn = this.effectiveEndColumn(dependencyGraph)
          while (currentColumn >= this.start.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn -= 1
          }
          currentRow -= 1
        }
      } else {
        let currentRow = this.start.row
        while (currentRow <= this.effectiveEndRow(dependencyGraph)) {
          let currentColumn = this.effectiveEndColumn(dependencyGraph)
          while (currentColumn >= this.start.col) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn -= 1
          }
          currentRow += 1
        }
      }
    } else {
      if (bottom > 0) {
        let currentRow = this.effectiveEndRow(dependencyGraph)
        while (currentRow >= this.start.row) {
          let currentColumn = this.start.col
          while (currentColumn <= this.effectiveEndColumn(dependencyGraph)) {
            yield simpleCellAddress(this.start.sheet, currentColumn, currentRow)
            currentColumn += 1
          }
          currentRow -= 1
        }
      } else {
        let currentRow = this.start.row
        while (currentRow <= this.effectiveEndRow(dependencyGraph)) {
          let currentColumn = this.start.col
          while (currentColumn <= this.effectiveEndColumn(dependencyGraph)) {
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

  public exceedsSheetSizeLimits(maxColumns: number, maxRows: number): boolean {
    return this.end.col >= maxColumns || this.end.row >= maxRows
  }

  public effectiveEndColumn(_dependencyGraph: DependencyGraph): number {
    return this.end.col
  }

  public effectiveEndRow(_dependencyGraph: DependencyGraph): number {
    return this.end.row
  }

  public effectiveWidth(_dependencyGraph: DependencyGraph): number {
    return this.width()
  }

  public effectiveHeight(_dependencyGraph: DependencyGraph): number {
    return this.height()
  }

  protected removeRows(rowStart: number, rowEnd: number) {
    if (rowStart > this.end.row) {
      return
    }

    if (rowEnd < this.start.row) {
      const numberOfRows = rowEnd - rowStart + 1
      return this.shiftByRows(-numberOfRows)
    }

    if (rowStart <= this.start.row) {
      this.start.row = rowStart
    }

    this.end.row -= Math.min(rowEnd, this.end.row) - rowStart + 1
  }

  protected removeColumns(columnStart: number, columnEnd: number) {
    if (columnStart > this.end.col) {
      return
    }

    if (columnEnd < this.start.col) {
      const numberOfColumns = columnEnd - columnStart + 1
      return this.shiftByColumns(-numberOfColumns)
    }

    if (columnStart <= this.start.col) {
      this.start.col = columnStart
    }

    this.end.col -= Math.min(columnEnd, this.end.col) - columnStart + 1
  }
}

export class AbsoluteColumnRange extends AbsoluteCellRange {
  constructor(sheet: number, columnStart: number, columnEnd: number) {
    super(
      simpleCellAddress(sheet, columnStart, 0),
      simpleCellAddress(sheet, columnEnd, Number.POSITIVE_INFINITY),
    )
  }

  public static fromColumnRange(x: ColumnRangeAst, baseAddress: SimpleCellAddress): AbsoluteColumnRange {
    const start = x.start.toSimpleColumnAddress(baseAddress)
    const end = x.end.toSimpleColumnAddress(baseAddress)
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }
    return new AbsoluteColumnRange(start.sheet, start.col, end.col)
  }

  public shouldBeRemoved() {
    return this.width() <= 0
  }

  public shiftByRows(_numberOfRows: number) {
    return
  }

  public expandByRows(_numberOfRows: number) {
    return
  }

  public shifted(byCols: number, _byRows: number): AbsoluteCellRange {
    return new AbsoluteColumnRange(this.sheet, this.start.col + byCols, this.end.col + byCols)
  }

  public rangeWithSameHeight(startColumn: number, numberOfColumns: number): AbsoluteCellRange {
    return new AbsoluteColumnRange(this.sheet, startColumn, startColumn + numberOfColumns - 1)
  }

  public exceedsSheetSizeLimits(maxColumns: number, _maxRows: number): boolean {
    return this.end.col >= maxColumns
  }

  public effectiveEndRow(dependencyGraph: DependencyGraph): number {
    return this.effectiveHeight(dependencyGraph) - 1
  }

  public effectiveHeight(dependencyGraph: DependencyGraph): number {
    return dependencyGraph.getSheetHeight(this.sheet)
  }

  protected removeRows(_rowStart: number, _rowEnd: number) {
    return
  }
}

export class AbsoluteRowRange extends AbsoluteCellRange {
  constructor(sheet: number, rowStart: number, rowEnd: number) {
    super(
      simpleCellAddress(sheet, 0, rowStart),
      simpleCellAddress(sheet, Number.POSITIVE_INFINITY, rowEnd),
    )
  }

  public static fromRowRangeAst(x: RowRangeAst, baseAddress: SimpleCellAddress): AbsoluteRowRange {
    const start = x.start.toSimpleRowAddress(baseAddress)
    const end = x.end.toSimpleRowAddress(baseAddress)
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }
    return new AbsoluteRowRange(start.sheet, start.row, end.row)
  }

  public shouldBeRemoved() {
    return this.height() <= 0
  }

  public shiftByColumns(_numberOfColumns: number) {
    return
  }

  public expandByColumns(_numberOfColumns: number) {
    return
  }

  public shifted(byCols: number, byRows: number): AbsoluteCellRange {
    return new AbsoluteRowRange(this.sheet, this.start.row + byRows, this.end.row + byRows)
  }

  public rangeWithSameWidth(startRow: number, numberOfRows: number): AbsoluteCellRange {
    return new AbsoluteRowRange(this.sheet, startRow, startRow + numberOfRows - 1)
  }

  public exceedsSheetSizeLimits(_maxColumns: number, maxRows: number): boolean {
    return this.end.row >= maxRows
  }

  public effectiveEndColumn(dependencyGraph: DependencyGraph): number {
    return this.effectiveWidth(dependencyGraph) - 1
  }

  public effectiveWidth(dependencyGraph: DependencyGraph): number {
    return dependencyGraph.getSheetWidth(this.sheet)
  }

  protected removeColumns(_columnStart: number, _columnEnd: number) {
    return
  }
}
