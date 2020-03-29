import {
  absoluteSheetReference,
  SimpleCellAddress,
  simpleCellAddress,
  simpleRowAddress,
  SimpleRowAddress,
} from '../Cell'
import {ReferenceType, SimpleRange} from './ColumnAddress'
import {AddressWithRow} from '../dependencyTransformers/common'

export class RowAddress implements AddressWithRow {
  private constructor(
    public readonly sheet: number | null,
    public readonly row: number,
    public readonly type: ReferenceType
  ) {}

  public static absolute(sheet: number | null, row: number) {
    return new RowAddress(sheet, row, ReferenceType.RELATIVE)
  }

  public static relative(sheet: number | null, row: number) {
    return new RowAddress(sheet, row, ReferenceType.ABSOLUTE)
  }

  public isRowAbsolute(): boolean {
    return (this.type === ReferenceType.RELATIVE)
  }

  public isRowRelative(): boolean {
    return (this.type === ReferenceType.ABSOLUTE)
  }

  public shiftedByRows(numberOfColumns: number): RowAddress {
    return new RowAddress(this.sheet, this.row + numberOfColumns, this.type)
  }

  public toSimpleRowAddress(baseAddress: SimpleCellAddress): SimpleRowAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.isRowRelative()) {
      row = baseAddress.row + this.row
    }
    return simpleRowAddress(sheet, row)
  }

  public toSimpleAddress(baseAddress: SimpleCellAddress): SimpleRange {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.isRowRelative()) {
      row = baseAddress.row + this.row
    }

    return {
      start: simpleCellAddress(sheet, 0, row),
      end: simpleCellAddress(sheet, Number.POSITIVE_INFINITY, row)
    }
  }

  public shiftRelativeDimensions(toRight: number, toBottom: number): RowAddress {
    const row = this.isRowRelative() ? this.row + toBottom : this.row
    return new RowAddress(this.sheet, row, this.type)
  }

  public shiftAbsoluteDimensions(toRight: number, toBottom: number): RowAddress {
    const row = this.isRowAbsolute() ? this.row + toBottom : this.row
    return new RowAddress(this.sheet, row, this.type)
  }

  public withAbsoluteSheet(sheet: number): RowAddress {
    return new RowAddress(sheet, this.row, this.type)
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== null ? `#${this.sheet}` : ''
    switch (this.type) {
      case ReferenceType.ABSOLUTE: {
        return `${sheetPart}#ROWR${this.row}`
      }
      case ReferenceType.RELATIVE: {
        return `${sheetPart}#ROWA${this.row}`
      }
    }
  }

  public unparse(baseAddress: SimpleCellAddress): string {
    const simpleAddress = this.toSimpleRowAddress(baseAddress)
    const dollar = this.type === ReferenceType.ABSOLUTE ? '$' : ''
    return `${dollar}${simpleAddress.row + 1}`
  }
}
