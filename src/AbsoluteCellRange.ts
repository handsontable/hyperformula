/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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

/**
 * Type guard that checks if an object is a valid SimpleCellRange.
 * @param {unknown} val - Value to check
 * @returns {boolean} True if and only if the object is a valid SimpleCellRange
 */
export function isSimpleCellRange(val: unknown): val is SimpleCellRange {
  if (val && (typeof val === 'object' || typeof val === 'function')) {
    const obj = val as Record<string, unknown>
    return 'start' in obj && isSimpleCellAddress(obj.start) && 'end' in obj && isSimpleCellAddress(obj.end)
  } else {
    return false
  }
}

/**
 * Builds a SimpleCellRange from start and end addresses.
 * @param {SimpleCellAddress} start - Top-left cell address
 * @param {SimpleCellAddress} end - Bottom-right cell address
 * @returns {SimpleCellRange} Plain-object cell range
 */
export const simpleCellRange = (start: SimpleCellAddress, end: SimpleCellAddress) => ({start, end})

/**
 * Represents a rectangular range of cells anchored at absolute coordinates within a single sheet.
 */
export class AbsoluteCellRange implements SimpleCellRange {
  public readonly start: SimpleCellAddress
  public readonly end: SimpleCellAddress

  /**
   * Creates a new absolute cell range.
   * @param {SimpleCellAddress} start - Top-left cell address (must share the sheet with end)
   * @param {SimpleCellAddress} end - Bottom-right cell address (must share the sheet with start)
   */
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

  /**
   * The sheet index this range belongs to.
   * @returns {number} Sheet index
   */
  public get sheet() {
    return this.start.sheet
  }

  /**
   * Builds an absolute range from two cell addresses, selecting the most specific subtype based on finiteness of width/height.
   * @param {SimpleCellAddress} start - Top-left cell address
   * @param {SimpleCellAddress} end - Bottom-right cell address
   * @returns {AbsoluteCellRange} Cell, column, or row range depending on dimensions
   */
  public static fromSimpleCellAddresses(start: SimpleCellAddress, end: SimpleCellAddress): AbsoluteCellRange {
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }

    const width = end.col - start.col
    const height = end.row - start.row

    if (Number.isFinite(height) && Number.isFinite(width)) {
      return new AbsoluteCellRange(start, end)
    }

    if (Number.isFinite(height)) {
      return new AbsoluteRowRange(start.sheet, start.row, end.row)
    }

    return new AbsoluteColumnRange(start.sheet, start.col, end.col)
  }

  /**
   * Builds an absolute range from a range AST node resolved against a base address.
   * @param {CellRangeAst | ColumnRangeAst | RowRangeAst} ast - Range AST node
   * @param {SimpleCellAddress} baseAddress - Address used to resolve relative references
   * @returns {AbsoluteCellRange} Resolved absolute range
   */
  public static fromAst(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    if (ast.type === AstNodeType.CELL_RANGE) {
      return AbsoluteCellRange.fromCellRange(ast, baseAddress)
    } else if (ast.type === AstNodeType.COLUMN_RANGE) {
      return AbsoluteColumnRange.fromColumnRange(ast, baseAddress)
    } else {
      return AbsoluteRowRange.fromRowRangeAst(ast, baseAddress)
    }
  }

  /**
   * Same as {@link AbsoluteCellRange.fromAst} but returns undefined when the AST cannot be resolved into a valid range.
   * @param {CellRangeAst | ColumnRangeAst | RowRangeAst} ast - Range AST node
   * @param {SimpleCellAddress} baseAddress - Address used to resolve relative references
   * @returns {Maybe<AbsoluteCellRange>} Resolved range, or undefined on failure
   */
  public static fromAstOrUndef(ast: CellRangeAst | ColumnRangeAst | RowRangeAst, baseAddress: SimpleCellAddress): Maybe<AbsoluteCellRange> {
    try {
      return AbsoluteCellRange.fromAst(ast, baseAddress)
    } catch (_e) {
      return undefined
    }
  }

  /**
   * Builds an absolute range from a CellRange (with relative or absolute components) resolved against a base address.
   * @param {CellRange} x - Range with possibly relative components
   * @param {SimpleCellAddress} baseAddress - Address used to resolve relative references
   * @returns {AbsoluteCellRange} Resolved absolute range
   */
  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(
      x.start.toSimpleCellAddress(baseAddress),
      x.end.toSimpleCellAddress(baseAddress),
    )
  }

  /**
   * Builds an absolute range with the given dimensions starting at the top-left corner.
   * @param {SimpleCellAddress} topLeftCorner - Top-left cell of the range
   * @param {number} width - Number of columns (may be infinite)
   * @param {number} height - Number of rows (may be infinite)
   * @returns {AbsoluteCellRange} New absolute range
   */
  public static spanFrom(topLeftCorner: SimpleCellAddress, width: number, height: number): AbsoluteCellRange {
    const ret = AbsoluteCellRange.spanFromOrUndef(topLeftCorner, width, height)
    if (ret === undefined) {
      throw new Error(WRONG_RANGE_SIZE)
    }
    return ret
  }

  /**
   * Same as {@link AbsoluteCellRange.spanFrom} but returns undefined for impossible spans (e.g. infinite-column range not anchored at row 0).
   * @param {SimpleCellAddress} topLeftCorner - Top-left cell of the range
   * @param {number} width - Number of columns (may be infinite)
   * @param {number} height - Number of rows (may be infinite)
   * @returns {Maybe<AbsoluteCellRange>} New absolute range, or undefined on invalid input
   */
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

  /**
   * Builds an absolute range from raw integer coordinates.
   * @param {number} sheet - Sheet index
   * @param {number} x1 - Start column
   * @param {number} y1 - Start row
   * @param {number} x2 - End column
   * @param {number} y2 - End row
   * @returns {AbsoluteCellRange} New absolute range
   */
  public static fromCoordinates(sheet: number, x1: number, y1: number, x2: number, y2: number): AbsoluteCellRange {
    return new AbsoluteCellRange(simpleCellAddress(sheet, x1, y1), simpleCellAddress(sheet, x2, y2))
  }

  /**
   * Indicates whether the range has finite size (no infinite row/column extent).
   * @returns {boolean} True if the range is finite
   */
  public isFinite(): boolean {
    return Number.isFinite(this.size())
  }

  /**
   * Checks whether this range overlaps another range (must be on the same sheet to overlap).
   * @param {AbsoluteCellRange} other - Range to compare against
   * @returns {boolean} True if the ranges share at least one cell
   */
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

  /**
   * Checks whether the given address lies within this range.
   * @param {SimpleCellAddress} address - Address to test
   * @returns {boolean} True if the address is inside the range
   */
  public addressInRange(address: SimpleCellAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }

    return this.start.row <= address.row
      && this.end.row >= address.row
      && this.start.col <= address.col
      && this.end.col >= address.col
  }

  /**
   * Checks whether the given column lies within this range.
   * @param {SimpleColumnAddress} address - Column address to test
   * @returns {boolean} True if the column is inside the range
   */
  public columnInRange(address: SimpleColumnAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }
    return this.start.col <= address.col && this.end.col >= address.col
  }

  /**
   * Checks whether the given row lies within this range.
   * @param {SimpleRowAddress} address - Row address to test
   * @returns {boolean} True if the row is inside the range
   */
  public rowInRange(address: SimpleRowAddress): boolean {
    if (this.sheet !== address.sheet) {
      return false
    }
    return this.start.row <= address.row && this.end.row >= address.row
  }

  /**
   * Checks whether this range fully contains another range.
   * @param {AbsoluteCellRange} range - Range to test for containment
   * @returns {boolean} True if the other range is fully inside this range
   */
  public containsRange(range: AbsoluteCellRange): boolean {
    return this.addressInRange(range.start) && this.addressInRange(range.end)
  }

  /**
   * Computes the intersection of this range with another range on the same sheet.
   * @param {AbsoluteCellRange} other - Range to intersect with
   * @returns {Maybe<AbsoluteCellRange>} Intersection range, or undefined when the ranges do not overlap
   */
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

  /**
   * Checks whether the given row index is strictly above the bottom edge and at or below the top edge.
   * @param {number} row - Row index to test
   * @returns {boolean} True if the row lies inside the range (excluding the top boundary)
   */
  public includesRow(row: number): boolean {
    return this.start.row < row && this.end.row >= row
  }

  /**
   * Checks whether the given column index is strictly right of the left edge and at or before the right edge.
   * @param {number} column - Column index to test
   * @returns {boolean} True if the column lies inside the range (excluding the left boundary)
   */
  public includesColumn(column: number): boolean {
    return this.start.col < column && this.end.col >= column
  }

  /**
   * Shifts the entire range vertically by a number of rows (mutates this range).
   * @param {number} numberOfRows - Number of rows to shift by (negative shifts upward)
   */
  public shiftByRows(numberOfRows: number) {
    this.start.row += numberOfRows
    this.end.row += numberOfRows
  }

  /**
   * Extends the bottom edge of the range by a number of rows (mutates this range).
   * @param {number} numberOfRows - Number of rows to add at the bottom
   */
  public expandByRows(numberOfRows: number) {
    this.end.row += numberOfRows
  }

  /**
   * Shifts the entire range horizontally by a number of columns (mutates this range).
   * @param {number} numberOfColumns - Number of columns to shift by (negative shifts leftward)
   */
  public shiftByColumns(numberOfColumns: number) {
    this.start.col += numberOfColumns
    this.end.col += numberOfColumns
  }

  /**
   * Returns a new range shifted by the given offsets without mutating this range.
   * @param {number} byCols - Column offset
   * @param {number} byRows - Row offset
   * @returns {AbsoluteCellRange} New shifted range
   */
  public shifted(byCols: number, byRows: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.start.col + byCols, this.start.row + byRows), this.width(), this.height())
  }

  /**
   * Extends the right edge of the range by a number of columns (mutates this range).
   * @param {number} numberOfColumns - Number of columns to add at the right
   */
  public expandByColumns(numberOfColumns: number) {
    this.end.col += numberOfColumns
  }

  /**
   * Moves the range to a different sheet (mutates this range).
   * @param {number} toSheet - Target sheet index
   */
  public moveToSheet(toSheet: number) {
    this.start.sheet = toSheet
    this.end.sheet = toSheet
  }

  /**
   * Removes a span of rows or columns from the range (mutates this range).
   * @param {Span} span - Span describing the rows or columns to remove
   */
  public removeSpan(span: Span) {
    if (span instanceof RowsSpan) {
      this.removeRows(span.start, span.end)
    } else {
      this.removeColumns(span.start, span.end)
    }
  }

  /**
   * Reports whether the range has collapsed and should be discarded.
   * @returns {boolean} True if width or height is non-positive
   */
  public shouldBeRemoved(): boolean {
    return this.width() <= 0 || this.height() <= 0
  }

  /**
   * Builds a new range with the same column extent as this one but rooted at a different row.
   * @param {number} startRow - Top row of the new range
   * @param {number} numberOfRows - Height of the new range
   * @returns {AbsoluteCellRange} New range with this range's width
   */
  public rangeWithSameWidth(startRow: number, numberOfRows: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, this.start.col, startRow), this.width(), numberOfRows)
  }

  /**
   * Builds a new range with the same row extent as this one but rooted at a different column.
   * @param {number} startColumn - Left column of the new range
   * @param {number} numberOfColumns - Width of the new range
   * @returns {AbsoluteCellRange} New range with this range's height
   */
  public rangeWithSameHeight(startColumn: number, numberOfColumns: number): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(simpleCellAddress(this.sheet, startColumn, this.start.row), numberOfColumns, this.height())
  }

  /**
   * Builds a debug string representation of the range.
   * @returns {string} Comma-separated `sheet,startCol,startRow,endCol,endRow`
   */
  public toString(): string {
    return `${this.start.sheet},${this.start.col},${this.start.row},${this.end.col},${this.end.row}`
  }

  /**
   * Returns the width (number of columns) of the range.
   * @returns {number} Width in columns
   */
  public width(): number {
    return this.end.col - this.start.col + 1
  }

  /**
   * Returns the height (number of rows) of the range.
   * @returns {number} Height in rows
   */
  public height(): number {
    return this.end.row - this.start.row + 1
  }

  /**
   * Returns the number of cells in the range.
   * @returns {number} Width multiplied by height
   */
  public size(): number {
    return this.height() * this.width()
  }

  /**
   * Builds a 2D array of every cell address in the range, indexed by `[row][column]`.
   * @returns {SimpleCellAddress[][]} Rectangular grid of cell addresses
   */
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

  /**
   * Returns a new range with the start address replaced (end address is reused).
   * @param {SimpleCellAddress} newStart - New top-left cell of the range
   * @returns {AbsoluteCellRange} New range
   */
  public withStart(newStart: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(newStart, this.end)
  }

  /**
   * Checks whether this range has the same width and height as another range.
   * @param {AbsoluteCellRange} other - Range to compare against
   * @returns {boolean} True if both width and height match
   */
  public sameDimensionsAs(other: AbsoluteCellRange) {
    return this.width() === other.width() && this.height() === other.height()
  }

  /**
   * Checks whether this range has the same start and end addresses as another range.
   * @param {AbsoluteCellRange} other - Range to compare against
   * @returns {boolean} True if both endpoints match
   */
  public sameAs(other: AbsoluteCellRange) {
    return equalSimpleCellAddress(this.start, other.start) && equalSimpleCellAddress(this.end, other.end)
  }

  /**
   * Maps each address in the range (clipped to the sheet's effective bounds) through a callback and returns the results in row-major 2D form.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve effective sheet bounds
   * @param {(arg: SimpleCellAddress) => T} op - Callback invoked for each address
   * @returns {T[][]} Mapped values indexed by `[row][column]`
   * @template T
   */
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

  /**
   * Returns every address in the range (clipped to the sheet's effective bounds) as a flat row-major list.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve effective sheet bounds
   * @returns {SimpleCellAddress[]} Flat list of cell addresses
   */
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

  /**
   * Iterates over every address in the range in a chosen direction (clipped to the sheet's effective bounds).
   * @param {number} right - Positive iterates columns right-to-left, non-positive iterates left-to-right
   * @param {number} bottom - Positive iterates rows bottom-to-top, non-positive iterates top-to-bottom
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve effective sheet bounds
   * @yields {SimpleCellAddress} The next cell address in the chosen iteration order
   */
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

  /**
   * Returns the address of the cell at the given offset inside the range.
   * @param {number} col - Zero-based column offset from the left edge
   * @param {number} row - Zero-based row offset from the top edge
   * @returns {SimpleCellAddress} Absolute address of the offset cell
   */
  public getAddress(col: number, row: number): SimpleCellAddress {
    if (col < 0 || row < 0 || row > this.height() - 1 || col > this.width() - 1) {
      throw Error('Index out of bound')
    }
    return simpleCellAddress(this.start.sheet, this.start.col + col, this.start.row + row)
  }

  /**
   * Checks whether the range exceeds the configured sheet size limits.
   * @param {number} maxColumns - Maximum number of columns allowed by the sheet
   * @param {number} maxRows - Maximum number of rows allowed by the sheet
   * @returns {boolean} True if the range escapes the limits
   */
  public exceedsSheetSizeLimits(maxColumns: number, maxRows: number): boolean {
    return this.end.col >= maxColumns || this.end.row >= maxRows
  }

  /**
   * Returns the effective last column index, accounting for unbounded ranges resolved through the dependency graph.
   * @param {DependencyGraph} _dependencyGraph - Dependency graph (unused on the bounded base implementation)
   * @returns {number} Effective last column index
   */
  public effectiveEndColumn(_dependencyGraph: DependencyGraph): number {
    return this.end.col
  }

  /**
   * Returns the effective last row index, accounting for unbounded ranges resolved through the dependency graph.
   * @param {DependencyGraph} _dependencyGraph - Dependency graph (unused on the bounded base implementation)
   * @returns {number} Effective last row index
   */
  public effectiveEndRow(_dependencyGraph: DependencyGraph): number {
    return this.end.row
  }

  /**
   * Returns the effective width of the range, accounting for unbounded ranges resolved through the dependency graph.
   * @param {DependencyGraph} _dependencyGraph - Dependency graph (unused on the bounded base implementation)
   * @returns {number} Effective width in columns
   */
  public effectiveWidth(_dependencyGraph: DependencyGraph): number {
    return this.width()
  }

  /**
   * Returns the effective height of the range, accounting for unbounded ranges resolved through the dependency graph.
   * @param {DependencyGraph} _dependencyGraph - Dependency graph (unused on the bounded base implementation)
   * @returns {number} Effective height in rows
   */
  public effectiveHeight(_dependencyGraph: DependencyGraph): number {
    return this.height()
  }

  /**
   * Mutates the range to account for the removal of a slice of rows.
   * @param {number} rowStart - First row removed (inclusive)
   * @param {number} rowEnd - Last row removed (inclusive)
   */
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

  /**
   * Mutates the range to account for the removal of a slice of columns.
   * @param {number} columnStart - First column removed (inclusive)
   * @param {number} columnEnd - Last column removed (inclusive)
   */
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

/**
 * Represents an absolute range that spans entire columns (infinite row extent).
 */
export class AbsoluteColumnRange extends AbsoluteCellRange {
  /**
   * Creates a column range covering the given column interval on a sheet.
   * @param {number} sheet - Sheet index
   * @param {number} columnStart - Leftmost column index
   * @param {number} columnEnd - Rightmost column index
   */
  constructor(sheet: number, columnStart: number, columnEnd: number) {
    super(
      simpleCellAddress(sheet, columnStart, 0),
      simpleCellAddress(sheet, columnEnd, Number.POSITIVE_INFINITY),
    )
  }

  /**
   * Builds a column range from a column-range AST node resolved against a base address.
   * @param {ColumnRangeAst} x - Column-range AST node
   * @param {SimpleCellAddress} baseAddress - Address used to resolve relative references
   * @returns {AbsoluteColumnRange} Resolved column range
   */
  public static fromColumnRange(x: ColumnRangeAst, baseAddress: SimpleCellAddress): AbsoluteColumnRange {
    const start = x.start.toSimpleColumnAddress(baseAddress)
    const end = x.end.toSimpleColumnAddress(baseAddress)
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }
    return new AbsoluteColumnRange(start.sheet, start.col, end.col)
  }

  /**
   * Reports whether the column range has collapsed and should be discarded.
   * @returns {boolean} True if width is non-positive
   */
  public shouldBeRemoved() {
    return this.width() <= 0
  }

  /**
   * Row-shift is a no-op for a full-column range.
   * @param {number} _numberOfRows - Ignored
   */
  public shiftByRows(_numberOfRows: number) {
    return
  }

  /**
   * Row-expansion is a no-op for a full-column range.
   * @param {number} _numberOfRows - Ignored
   */
  public expandByRows(_numberOfRows: number) {
    return
  }

  /**
   * Returns a new column range shifted by the given column offset (row offset is ignored).
   * @param {number} byCols - Column offset
   * @param {number} _byRows - Ignored
   * @returns {AbsoluteCellRange} New column range
   */
  public shifted(byCols: number, _byRows: number): AbsoluteCellRange {
    return new AbsoluteColumnRange(this.sheet, this.start.col + byCols, this.end.col + byCols)
  }

  /**
   * Builds a new column range with a different column extent (height is unaffected).
   * @param {number} startColumn - Left column of the new range
   * @param {number} numberOfColumns - Width of the new range
   * @returns {AbsoluteCellRange} New column range
   */
  public rangeWithSameHeight(startColumn: number, numberOfColumns: number): AbsoluteCellRange {
    return new AbsoluteColumnRange(this.sheet, startColumn, startColumn + numberOfColumns - 1)
  }

  /**
   * Checks whether the column range exceeds the configured column count (row limit is ignored).
   * @param {number} maxColumns - Maximum number of columns allowed by the sheet
   * @param {number} _maxRows - Ignored
   * @returns {boolean} True if the range escapes the column limit
   */
  public exceedsSheetSizeLimits(maxColumns: number, _maxRows: number): boolean {
    return this.end.col >= maxColumns
  }

  /**
   * Returns the effective last row, taken from the sheet's current height.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve sheet height
   * @returns {number} Last populated row index of the sheet
   */
  public effectiveEndRow(dependencyGraph: DependencyGraph): number {
    return this.effectiveHeight(dependencyGraph) - 1
  }

  /**
   * Returns the effective height, taken from the sheet's current height.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve sheet height
   * @returns {number} Current sheet height in rows
   */
  public effectiveHeight(dependencyGraph: DependencyGraph): number {
    return dependencyGraph.getSheetHeight(this.sheet)
  }

  /**
   * Row removal is a no-op for a full-column range.
   * @param {number} _rowStart - Ignored
   * @param {number} _rowEnd - Ignored
   */
  protected removeRows(_rowStart: number, _rowEnd: number) {
    return
  }
}

/**
 * Represents an absolute range that spans entire rows (infinite column extent).
 */
export class AbsoluteRowRange extends AbsoluteCellRange {
  /**
   * Creates a row range covering the given row interval on a sheet.
   * @param {number} sheet - Sheet index
   * @param {number} rowStart - Topmost row index
   * @param {number} rowEnd - Bottommost row index
   */
  constructor(sheet: number, rowStart: number, rowEnd: number) {
    super(
      simpleCellAddress(sheet, 0, rowStart),
      simpleCellAddress(sheet, Number.POSITIVE_INFINITY, rowEnd),
    )
  }

  /**
   * Builds a row range from a row-range AST node resolved against a base address.
   * @param {RowRangeAst} x - Row-range AST node
   * @param {SimpleCellAddress} baseAddress - Address used to resolve relative references
   * @returns {AbsoluteRowRange} Resolved row range
   */
  public static fromRowRangeAst(x: RowRangeAst, baseAddress: SimpleCellAddress): AbsoluteRowRange {
    const start = x.start.toSimpleRowAddress(baseAddress)
    const end = x.end.toSimpleRowAddress(baseAddress)
    if (start.sheet !== end.sheet) {
      throw new SheetsNotEqual(start.sheet, end.sheet)
    }
    return new AbsoluteRowRange(start.sheet, start.row, end.row)
  }

  /**
   * Reports whether the row range has collapsed and should be discarded.
   * @returns {boolean} True if height is non-positive
   */
  public shouldBeRemoved() {
    return this.height() <= 0
  }

  /**
   * Column-shift is a no-op for a full-row range.
   * @param {number} _numberOfColumns - Ignored
   */
  public shiftByColumns(_numberOfColumns: number) {
    return
  }

  /**
   * Column-expansion is a no-op for a full-row range.
   * @param {number} _numberOfColumns - Ignored
   */
  public expandByColumns(_numberOfColumns: number) {
    return
  }

  /**
   * Returns a new row range shifted by the given row offset (column offset is ignored).
   * @param {number} byCols - Ignored
   * @param {number} byRows - Row offset
   * @returns {AbsoluteCellRange} New row range
   */
  public shifted(byCols: number, byRows: number): AbsoluteCellRange {
    return new AbsoluteRowRange(this.sheet, this.start.row + byRows, this.end.row + byRows)
  }

  /**
   * Builds a new row range with a different row extent (width is unaffected).
   * @param {number} startRow - Top row of the new range
   * @param {number} numberOfRows - Height of the new range
   * @returns {AbsoluteCellRange} New row range
   */
  public rangeWithSameWidth(startRow: number, numberOfRows: number): AbsoluteCellRange {
    return new AbsoluteRowRange(this.sheet, startRow, startRow + numberOfRows - 1)
  }

  /**
   * Checks whether the row range exceeds the configured row count (column limit is ignored).
   * @param {number} _maxColumns - Ignored
   * @param {number} maxRows - Maximum number of rows allowed by the sheet
   * @returns {boolean} True if the range escapes the row limit
   */
  public exceedsSheetSizeLimits(_maxColumns: number, maxRows: number): boolean {
    return this.end.row >= maxRows
  }

  /**
   * Returns the effective last column, taken from the sheet's current width.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve sheet width
   * @returns {number} Last populated column index of the sheet
   */
  public effectiveEndColumn(dependencyGraph: DependencyGraph): number {
    return this.effectiveWidth(dependencyGraph) - 1
  }

  /**
   * Returns the effective width, taken from the sheet's current width.
   * @param {DependencyGraph} dependencyGraph - Graph used to resolve sheet width
   * @returns {number} Current sheet width in columns
   */
  public effectiveWidth(dependencyGraph: DependencyGraph): number {
    return dependencyGraph.getSheetWidth(this.sheet)
  }

  /**
   * Column removal is a no-op for a full-row range.
   * @param {number} _columnStart - Ignored
   * @param {number} _columnEnd - Ignored
   */
  protected removeColumns(_columnStart: number, _columnEnd: number) {
    return
  }
}
