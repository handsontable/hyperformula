/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {
  absoluteSheetReference,
  invalidSimpleCellAddress,
  simpleCellAddress,
  SimpleCellAddress,
  simpleColumnAddress,
  SimpleColumnAddress,
  simpleRowAddress,
  SimpleRowAddress,
} from '../Cell'
import {Maybe} from '../Maybe'
import {AddressWithColumn, AddressWithRow} from './Address'
import {columnIndexToLabel} from './addressRepresentationConverters'
import {ColumnAddress, ReferenceType} from './ColumnAddress'
import {RowAddress} from './RowAddress'

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
  constructor(
    public readonly col: number,
    public readonly row: number,
    public readonly type: CellReferenceType,
    public readonly sheet?: number,
  ) {
  }

  public static fromColAndRow(col: ColumnAddress, row: RowAddress, sheet: number | undefined): CellAddress {
    const factoryMethod: (col: number, row: number, sheet?: number) => CellAddress = col.isColumnAbsolute() && row.isRowAbsolute()
      ? CellAddress.absolute.bind(this)
      : col.isColumnAbsolute()
        ? CellAddress.absoluteCol.bind(this)
        : row.isRowAbsolute()
          ? CellAddress.absoluteRow.bind(this)
          : CellAddress.relative.bind(this)

    return factoryMethod(col.col, row.row, sheet)
  }

  public static relative(col: number, row: number, sheet?: number) {
    return new CellAddress(col, row, CellReferenceType.CELL_REFERENCE_RELATIVE, sheet)
  }

  public static absolute(col: number, row: number, sheet?: number) {
    return new CellAddress(col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE, sheet)
  }

  public static absoluteCol(col: number, row: number, sheet?: number) {
    return new CellAddress(col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL, sheet)
  }

  public static absoluteRow(col: number, row: number, sheet?: number) {
    return new CellAddress(col, row, CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW, sheet)
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

  public toColumnAddress(): ColumnAddress {
    const refType = this.isColumnRelative() ? ReferenceType.RELATIVE : ReferenceType.ABSOLUTE
    return new ColumnAddress(refType, this.col, this.sheet)
  }

  public toRowAddress(): RowAddress {
    const refType = this.isRowRelative() ? ReferenceType.RELATIVE : ReferenceType.ABSOLUTE
    return new RowAddress(refType, this.row, this.sheet)
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

  public isAbsolute(): boolean {
    return (this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE && this.sheet !== undefined)
  }

  public shiftedByRows(numberOfRows: number): CellAddress {
    return new CellAddress(this.col, this.row + numberOfRows, this.type, this.sheet)
  }

  public shiftedByColumns(numberOfColumns: number): CellAddress {
    return new CellAddress(this.col + numberOfColumns, this.row, this.type, this.sheet)
  }

  public moved(toSheet: number, toRight: number, toBottom: number): CellAddress {
    const newSheet = this.sheet === undefined ? undefined : toSheet
    return new CellAddress(this.col + toRight, this.row + toBottom, this.type, newSheet)
  }

  public withSheet(sheet: number | undefined): CellAddress {
    return new CellAddress(this.col, this.row, this.type, sheet)
  }

  public isInvalid(baseAddress: SimpleCellAddress): boolean {
    return invalidSimpleCellAddress(this.toSimpleCellAddress(baseAddress))
  }

  public shiftRelativeDimensions(toRight: number, toBottom: number): CellAddress {
    const col = this.isColumnAbsolute() ? this.col : this.col + toRight
    const row = this.isRowAbsolute() ? this.row : this.row + toBottom
    return new CellAddress(col, row, this.type, this.sheet)
  }

  public shiftAbsoluteDimensions(toRight: number, toBottom: number): CellAddress {
    const col = this.isColumnRelative() ? this.col : this.col + toRight
    const row = this.isRowRelative() ? this.row : this.row + toBottom
    return new CellAddress(col, row, this.type, this.sheet)
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== undefined ? `#${this.sheet}` : ''
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

  public unparse(baseAddress: SimpleCellAddress): Maybe<string> {
    const simpleAddress = this.toSimpleCellAddress(baseAddress)
    if (invalidSimpleCellAddress(simpleAddress)) {
      return undefined
    }
    const column = columnIndexToLabel(simpleAddress.col)
    const rowDollar = this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? '$' : ''
    const colDollar = this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || this.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? '$' : ''
    return `${colDollar}${column}${rowDollar}${simpleAddress.row + 1}`
  }

  public exceedsSheetSizeLimits(maxColumns: number, maxRows: number): boolean {
    return this.row >= maxRows || this.col >= maxColumns
  }
}
