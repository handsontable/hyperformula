import {absoluteSheetReference, simpleCellAddress, SimpleCellAddress} from '../Cell'


export enum ColumnReferenceType {
  COLUMN_RELATIVE = 'COLUMN_RELATIVE',
  COLUMN_ABSOLUTE = 'COLUMN_ABSOLUTE',
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

  public toSimpleCellAddress(baseAddress: SimpleCellAddress): SimpleCellAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    if (this.type === ColumnReferenceType.COLUMN_ABSOLUTE) {
      return simpleCellAddress(sheet, this.col, Number.POSITIVE_INFINITY)
    } else {
      return simpleCellAddress(sheet, baseAddress.col + this.col, Number.POSITIVE_INFINITY)
    }
  }
}
