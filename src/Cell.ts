import {CellAddress} from './CellAddress'
import {Matrix} from './Matrix'

/**
 * Possible errors returned by our interpreter.
 */
export enum ErrorType {
  /** Division by zero. */
  DIV_BY_ZERO = 'DIV_BY_ZERO',

  /** Unknown function name. */
  NAME = 'NAME',
  VALUE = 'VALUE',
  NUM = 'NUM',
  NA = 'NA',

  /** Cyclic dependency. */
  CYCLE = 'CYCLE',

  /* Wrong address reference. */
  REF = 'REF',
}

export class CellError {
  constructor(public readonly type: ErrorType) {
  }
}

export type CellValue = boolean | string | number | Matrix | CellError

export interface SimpleCellAddress {
  col: number,
  row: number,
  sheet: number,
}
export const simpleCellAddress = (sheet: number, col: number, row: number): SimpleCellAddress => ({ sheet, col, row })

export interface SheetCellAddress {
  col: number,
  row: number,
}
export const sheetCellAddress = (col: number, row: number): SheetCellAddress => ({ col, row })

/**
 * Converts simple object representation of cell address to string representation.
 *
 * @param address - address to convert
 * @returns string representation, e.g. 'C64'
 */
export function sheetCellAddressToString(address: SheetCellAddress): string {
  let result = ''
  let column = address.col

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result
    column = Math.floor(column / 26) - 1
  }

  return `${result.toUpperCase()}${address.row + 1}`
}

export interface CellRange {
  start: CellAddress,
  end: CellAddress,
}
export const buildCellRange = (start: CellAddress, end: CellAddress): CellRange => ({ start, end })
