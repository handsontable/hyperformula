/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress, SimpleColumnAddress, SimpleRowAddress} from '../Cell'

export interface AddressWithSheet {
  sheet?: number,

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
