import {SimpleCellAddress, SimpleColumnAddress, SimpleRowAddress} from '../Cell'

export interface Address extends AddressWithColumn, AddressWithRow {
}

export interface AddressWithSheet {
  sheet: number | null,
  shiftRelativeDimensions(toRight: number, toBottom: number): AddressWithSheet,
  shiftAbsoluteDimensions(toRight: number, toBottom: number): AddressWithSheet,
  moved(toSheet: number, toRight: number, toBottom: number): AddressWithSheet,
}

export interface AddressWithColumn extends AddressWithSheet {
  col: number,
  isColumnAbsolute(): boolean,
  isColumnRelative(): boolean,
  shiftedByColumns(columns: number): AddressWithColumn,
  toSimpleColumnAddress(baseAddress: SimpleCellAddress): SimpleColumnAddress,
}

export interface AddressWithRow extends AddressWithSheet {
  row: number,
  isRowAbsolute(): boolean,
  isRowRelative(): boolean,
  shiftedByRows(rows: number): AddressWithRow,
  toSimpleRowAddress(baseAddress: SimpleCellAddress): SimpleRowAddress,
}