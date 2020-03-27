import {absoluteSheetReference, simpleCellAddress, SimpleCellAddress} from '../Cell'


export enum ColumnReferenceType {
  COLUMN_RELATIVE = 'COLUMN_RELATIVE',
  COLUMN_ABSOLUTE = 'COLUMN_ABSOLUTE',
}

export interface SimpleRange {
  start: SimpleCellAddress,
  end: SimpleCellAddress,
}

export class ColumnAddress {
  private constructor(
    public readonly sheet: number | null,
    public readonly col: number,
    public readonly type: ColumnReferenceType
  ) {}

  public static absolute(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ColumnReferenceType.COLUMN_ABSOLUTE)
  }

  public static relative(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ColumnReferenceType.COLUMN_RELATIVE)
  }

  public toSimpleAddress(baseAddress: SimpleCellAddress): SimpleRange {
    const sheet = absoluteSheetReference(this, baseAddress)
    let column = this.col
    if (this.type === ColumnReferenceType.COLUMN_RELATIVE) {
      column = baseAddress.col + this.col
    }

    return {
      start: simpleCellAddress(sheet, column, 0),
      end: simpleCellAddress(sheet, column, Number.POSITIVE_INFINITY)
    }
  }
}
