/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {RawCellContent} from './CellContentParser'
import {Index} from './HyperFormula'

export interface IBatchExecutor {
  addRows: (sheet: number, ...indexes: Index[]) => void,
  removeRows: (sheet: number, ...indexes: Index[]) => void,
  addColumns: (sheet: number, ...indexes: Index[]) => void,
  removeColumns: (sheet: number, ...indexes: Index[]) => void,
  moveCells: (sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) => void,
  setCellContents: (topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent) => void,
  clearSheet: (sheet: string) => void,
}
