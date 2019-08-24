/*
 * A class representing a set of columns in specific sheet
 */

export class ColumnsSpan {
  constructor(
    public readonly sheet: number,
    public readonly columnStart: number,
    public readonly columnEnd: number,
  ) {
  }

  public get numberOfColumns() {
    return this.columnEnd - this.columnStart + 1
  }

  public* columns(): IterableIterator<number> {
    for (let col = this.columnStart; col <= this.columnEnd; ++col) {
      yield col
    }
  }
}
