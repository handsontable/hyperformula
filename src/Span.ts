/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export type Span = RowsSpan | ColumnsSpan

/*
 * A class representing a set of rows in specific sheet
 */
export class RowsSpan {

  constructor(
    public readonly sheet: number,
    public readonly rowStart: number,
    public readonly rowEnd: number,
  ) {
    if (rowStart < 0) {
      throw Error('Starting row cant be less than 0')
    }
    if (rowEnd < rowStart) {
      throw Error('Row span cant end before start')
    }
  }

  public get numberOfRows() {
    return this.rowEnd - this.rowStart + 1
  }

  public get start(): number {
    return this.rowStart
  }

  public get end(): number {
    return this.rowEnd
  }

  public static fromNumberOfRows(sheet: number, rowStart: number, numberOfRows: number) {
    return new RowsSpan(sheet, rowStart, rowStart + numberOfRows - 1)
  }

  public static fromRowStartAndEnd(sheet: number, rowStart: number, rowEnd: number) {
    return new RowsSpan(sheet, rowStart, rowEnd)
  }

  public* rows(): IterableIterator<number> {
    for (let col = this.rowStart; col <= this.rowEnd; ++col) {
      yield col
    }
  }

  public intersect(otherSpan: RowsSpan): RowsSpan | null {
    if (this.sheet !== otherSpan.sheet) {
      throw Error('Can\'t intersect spans from different sheets')
    }
    const start = Math.max(this.rowStart, otherSpan.rowStart)
    const end = Math.min(this.rowEnd, otherSpan.rowEnd)
    if (start > end) {
      return null
    }
    return new RowsSpan(this.sheet, start, end)
  }

  public firstRow(): RowsSpan {
    return new RowsSpan(this.sheet, this.rowStart, this.rowStart)
  }
}

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
      throw Error('Starting column cant be less than 0')
    }
    if (columnEnd < columnStart) {
      throw Error('Column span cant end before start')
    }
  }

  public get numberOfColumns() {
    return this.columnEnd - this.columnStart + 1
  }

  public get start(): number {
    return this.columnStart
  }

  public get end(): number {
    return this.columnEnd
  }

  public static fromNumberOfColumns(sheet: number, columnStart: number, numberOfColumns: number) {
    return new ColumnsSpan(sheet, columnStart, columnStart + numberOfColumns - 1)
  }

  public static fromColumnStartAndEnd(sheet: number, columnStart: number, columnEnd: number) {
    return new ColumnsSpan(sheet, columnStart, columnEnd)
  }

  public* columns(): IterableIterator<number> {
    for (let col = this.columnStart; col <= this.columnEnd; ++col) {
      yield col
    }
  }

  public intersect(otherSpan: ColumnsSpan): ColumnsSpan | null {
    if (this.sheet !== otherSpan.sheet) {
      throw Error('Can\'t intersect spans from different sheets')
    }
    const start = Math.max(this.columnStart, otherSpan.columnStart)
    const end = Math.min(this.columnEnd, otherSpan.columnEnd)
    if (start > end) {
      return null
    }
    return new ColumnsSpan(this.sheet, start, end)
  }

  public firstColumn(): ColumnsSpan {
    return new ColumnsSpan(this.sheet, this.columnStart, this.columnStart)
  }
}
