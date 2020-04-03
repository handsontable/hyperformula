import {
  absoluteSheetReference,
  simpleCellAddress,
  SimpleCellAddress,
  simpleColumnAddress,
  SimpleColumnAddress,
  simpleRowAddress,
  SimpleRowAddress,
} from '../Cell'
import {columnIndexToLabel} from './addressRepresentationConverters'
import {AddressWithColumn, AddressWithRow} from './Address'

/** Possible kinds of cell references */
export enum CellReferenceType {
  /** Cell reference with both row and column relative. */
  CELL_REFERENCE_RELATIVE = 'CELL_REFERENCE',

  /** Cell reference with both row and column absolute. */
  CELL_REFERENCE_ABSOLUTE = 'CELL_REFERENCE_ABSOLUTE',

  /** Cell reference with absolute column and relative row. */
  CELL_REFERENCE_ABSOLUTE_COL = 'CELL_REFERENCE_ABSOLUTE_COL',

  /** Cell reference with relative column and absolute row. */
  CELL_REFERENCE_ABSOLUTE_ROW = 'CELL_REFERENCE_ABSOLUTE_ROW',
}

export class CellAddress implements AddressWithColumn, AddressWithRow {

  public static relative(sheet: number | null, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_RELATIVE)
  }

  public static absolute(sheet: number | null, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE)
  }

  public static absoluteCol(sheet: number | null, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
  }

  public static absoluteRow(sheet: number | null, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
  }
  constructor(
    public readonly sheet: number | null,
    public readonly col: number,
    public readonly row: number,
    public readonly type: CellReferenceType,
  ) {
  }

  /**
   * Converts R0C0 representation of cell address to simple object representation.
   *
   * @param baseAddress - base address for R0C0 shifts
   */
  public toSimpleCellAddress(baseAddress: SimpleCellAddress): SimpleCellAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE) {
      return simpleCellAddress(sheet, this.col, this.row)
    } else if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
      return simpleCellAddress(sheet, baseAddress.col + this.col, this.row)
    } else if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
      return simpleCellAddress(sheet, this.col, baseAddress.row + this.row)
    } else {
      return simpleCellAddress(sheet, baseAddress.col + this.col, baseAddress.row + this.row)
    }
  }

  public toSimpleColumnAddress(baseAddress: SimpleCellAddress): SimpleColumnAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let column = this.col
    if (this.isColumnRelative()) {
      column += baseAddress.col
    }
    return simpleColumnAddress(sheet, column)
  }

  public toSimpleRowAddress(baseAddress: SimpleCellAddress): SimpleRowAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.isRowRelative()) {
      row += baseAddress.row
    }
    return simpleRowAddress(sheet, row)
  }

  public isRowAbsolute(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
  }

  public isColumnAbsolute(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
  }

  public isColumnRelative(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_RELATIVE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
  }

  public isRowRelative(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_RELATIVE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
  }

  public shiftedByRows(numberOfRows: number): CellAddress {
    return new CellAddress(this.sheet, this.col, this.row + numberOfRows, this.type)
  }

  public shiftedByColumns(numberOfColumns: number): CellAddress {
    return new CellAddress(this.sheet, this.col + numberOfColumns, this.row, this.type)
  }

  public moved(toSheet: number, toRight: number, toBottom: number): CellAddress {
    const newSheet = this.sheet === null ? null : toSheet
    return new CellAddress(newSheet, this.col + toRight, this.row + toBottom, this.type)
  }

  public withAbsoluteSheet(sheet: number): CellAddress {
    return new CellAddress(sheet, this.col, this.row, this.type)
  }

  public shiftRelativeDimensions(toRight: number, toBottom: number): CellAddress {
    const col = this.isColumnAbsolute() ? this.col : this.col + toRight
    const row = this.isRowAbsolute() ? this.row : this.row + toBottom
    return new CellAddress(this.sheet, col, row, this.type)
  }

  public shiftAbsoluteDimensions(toRight: number, toBottom: number): CellAddress {
    const col = this.isColumnRelative() ? this.col : this.col + toRight
    const row = this.isRowRelative() ? this.row : this.row + toBottom
    return new CellAddress(this.sheet, col, row, this.type)
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== null ? `#${this.sheet}` : ''
    switch (this.type) {
      case CellReferenceType.CELL_REFERENCE_RELATIVE: {
        return `${sheetPart}#${this.row}R${this.col}`
      }
      case CellReferenceType.CELL_REFERENCE_ABSOLUTE: {
        return `${sheetPart}#${this.row}A${this.col}`
      }
      case CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL: {
        return `${sheetPart}#${this.row}AC${this.col}`
      }
      case CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW: {
        return `${sheetPart}#${this.row}AR${this.col}`
      }
    }
  }

  public unparse(baseAddress: SimpleCellAddress): string {
    const simpleAddress = this.toSimpleCellAddress(baseAddress)
    const column = columnIndexToLabel(simpleAddress.col)
    const rowDollar = this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? '$' : ''
    const colDollar = this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? '$' : ''
    return `${colDollar}${column}${rowDollar}${simpleAddress.row + 1}`
  }
}
