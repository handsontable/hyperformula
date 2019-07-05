import {simpleCellAddress, SimpleCellAddress} from '../Cell'

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

export class CellAddress {

  public static relative(sheet: number, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_RELATIVE)
  }

  public static absolute(sheet: number, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE)
  }

  public static absoluteCol(sheet: number, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
  }

  public static absoluteRow(sheet: number, col: number, row: number) {
    return new CellAddress(sheet, col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
  }
  constructor(
    public readonly sheet: number,
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
    if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE) {
      return simpleCellAddress(this.sheet, this.col, this.row)
    } else if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
      return simpleCellAddress(this.sheet, baseAddress.col + this.col, this.row)
    } else if (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
      return simpleCellAddress(this.sheet, this.col, baseAddress.row + this.row)
    } else {
      return simpleCellAddress(this.sheet, baseAddress.col + this.col, baseAddress.row + this.row)
    }
  }

  public isRowAbsolute(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
  }

  public isColumnAbsolute(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
  }

  public shiftedByRows(numberOfRows: number): CellAddress {
    return new CellAddress(this.sheet, this.col, this.row + numberOfRows, this.type)
  }

  public shiftedByColumns(numberOfColumns: number): CellAddress {
    return new CellAddress(this.sheet, this.col + numberOfColumns, this.row, this.type)
  }
}
