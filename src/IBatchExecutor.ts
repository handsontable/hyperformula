/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {RawCellContent} from './CellContentParser'
import {ColumnRowIndex} from './CrudOperations'

export interface IBatchExecutor {
  addRows: (sheet: number, ...indexes: ColumnRowIndex[]) => void,
  removeRows: (sheet: number, ...indexes: ColumnRowIndex[]) => void,
  addColumns: (sheet: number, ...indexes: ColumnRowIndex[]) => void,
  removeColumns: (sheet: number, ...indexes: ColumnRowIndex[]) => void,
  moveCells: (sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) => void,
  setCellContents: (topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent) => void,
  clearSheet: (sheet: string) => void,
}
