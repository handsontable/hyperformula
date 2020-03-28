import {
  absoluteSheetReference,
  simpleCellAddress,
  SimpleCellAddress,
  simpleColumnAddress,
  SimpleColumnAddress
} from '../Cell'
import {CellReferenceType} from './CellAddress'
import {columnIndexToLabel} from './addressRepresentationConverters'


export enum ReferenceType {
  RELATIVE = 'RELATIVE',
  ABSOLUTE = 'ABSOLUTE',
}

export interface SimpleRange {
  start: SimpleCellAddress,
  end: SimpleCellAddress,
}

export class ColumnAddress {
  private constructor(
    public readonly sheet: number | null,
    public readonly col: number,
    public readonly type: ReferenceType
  ) {}

  public static absolute(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ReferenceType.ABSOLUTE)
  }

  public static relative(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ReferenceType.RELATIVE)
  }

  public isColumnAbsolute(): boolean {
    return (this.type === ReferenceType.ABSOLUTE)
  }
  public isColumnRelative(): boolean {
    return (this.type === ReferenceType.RELATIVE)
  }

  public shiftedByColumns(numberOfColumns: number): ColumnAddress {
    return new ColumnAddress(this.sheet, this.col + numberOfColumns, this.type)
  }

  public toSimpleColumnAddress(baseAddress: SimpleCellAddress): SimpleColumnAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let column = this.col
    if (this.type === ReferenceType.RELATIVE) {
      column = baseAddress.col + this.col
    }
    return simpleColumnAddress(sheet, column)
  }

  public toSimpleAddress(baseAddress: SimpleCellAddress): SimpleRange {
    const sheet = absoluteSheetReference(this, baseAddress)
    let column = this.col
    if (this.type === ReferenceType.RELATIVE) {
      column = baseAddress.col + this.col
    }

    return {
      start: simpleCellAddress(sheet, column, 0),
      end: simpleCellAddress(sheet, column, Number.POSITIVE_INFINITY)
    }
  }

  public shiftRelativeDimensions(toRight: number, toBottom: number): ColumnAddress {
    const col = this.isColumnRelative() ? this.col + toRight : this.col
    return new ColumnAddress(this.sheet, col, this.type)
  }

  public shiftAbsoluteDimensions(toRight: number, toBottom: number): ColumnAddress {
    const col = this.isColumnAbsolute() ? this.col + toRight : this.col
    return new ColumnAddress(this.sheet, col, this.type)
  }

  public withAbsoluteSheet(sheet: number): ColumnAddress {
    return new ColumnAddress(sheet, this.col, this.type)
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== null ? `#${this.sheet}` : ''
    switch (this.type) {
      case ReferenceType.RELATIVE: {
        return `${sheetPart}#COLR${this.col}`
      }
      case ReferenceType.ABSOLUTE: {
        return `${sheetPart}#COLA${this.col}`
      }
    }
  }

  public unparse(baseAddress: SimpleCellAddress): string {
    const simpleAddress = this.toSimpleColumnAddress(baseAddress)
    const column = columnIndexToLabel(simpleAddress.col)
    const dollar = this.type === ReferenceType.ABSOLUTE ? '$' : ''
    return `${dollar}${column}`
  }
}
