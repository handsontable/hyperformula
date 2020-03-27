import {
  absoluteSheetReference,
  SimpleCellAddress,
  simpleCellAddress,
  simpleRowAddress,
  SimpleRowAddress,
} from '../Cell'
import {SimpleRange} from './ColumnAddress'


export enum ColumnReferenceType {
  ROW_RELATIVE = 'ROW_RELATIVE',
  ROW_ABSOLUTE = 'ROW_ABSOLUTE',
}

export class RowAddress {
  private constructor(
    public readonly sheet: number | null,
    public readonly row: number,
    public readonly type: ColumnReferenceType
  ) {}

  public static absolute(sheet: number | null, row: number) {
    return new RowAddress(sheet, row, ColumnReferenceType.ROW_ABSOLUTE)
  }

  public static relative(sheet: number | null, row: number) {
    return new RowAddress(sheet, row, ColumnReferenceType.ROW_RELATIVE)
  }

  public isRowAbsolute(): boolean {
    return (this.type === ColumnReferenceType.ROW_ABSOLUTE)
  }

  public shiftedByRows(numberOfColumns: number): RowAddress {
    return new RowAddress(this.sheet, this.row + numberOfColumns, this.type)
  }

  public toSimpleRowAddress(baseAddress: SimpleCellAddress): SimpleRowAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.type === ColumnReferenceType.ROW_RELATIVE) {
      row = baseAddress.row + this.row
    }
    return simpleRowAddress(sheet, row)
  }

  public toSimpleAddress(baseAddress: SimpleCellAddress): SimpleRange {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.type === ColumnReferenceType.ROW_RELATIVE) {
      row = baseAddress.row + this.row
    }

    return {
      start: simpleCellAddress(sheet, Number.NEGATIVE_INFINITY, row),
      end: simpleCellAddress(sheet, Number.POSITIVE_INFINITY, row)
    }
  }
}
