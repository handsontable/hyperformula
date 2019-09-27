
/*
 * A class representing a set of rows in specific sheet
 */
export class RowsSpan {

  public get numberOfRows() {
    return this.rowEnd - this.rowStart + 1
  }

  public static fromNumberOfRows(sheet: number, rowStart: number, numberOfRows: number) {
    return new RowsSpan(sheet, rowStart, rowStart + numberOfRows - 1)
  }
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

  public* rows(): IterableIterator<number> {
    for (let col = this.rowStart; col <= this.rowEnd; ++col) {
      yield col
    }
  }

  public intersect(otherSpan: RowsSpan): RowsSpan | null {
    if (this.sheet !== otherSpan.sheet) {
      throw Error("Can't intersect spans from different sheets")
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

  public include(row: number): boolean {
    return (row >= this.rowStart) && (row <= this.rowEnd);
  }
}
