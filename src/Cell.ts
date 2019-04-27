import {Matrix, MatrixSize} from './Matrix'
import {SheetMapping} from './SheetMapping'
import {CellAddress} from './CellAddress'

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

export interface CellError {
  type: ErrorType
}

/**
 * Builds cell error of given type.
 *
 * @param error - type of error
 */
export const cellError = (error: ErrorType): CellError => ({type: error})

/** Returns true if value is a cell error. */
export const isCellError = (value: any): value is CellError => {
  return value.type !== undefined && value.type in ErrorType
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
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param baseAddress - base address for R0C0 conversion
 */
export const cellAddressFromString = (sheetMapping: SheetMapping, stringAddress: string, baseAddress: SimpleCellAddress, overrideSheet?: number): CellAddress => {
  const result = stringAddress.match(/^(\$([A-Za-z0-9]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/)!

  let col
  if (result[4].length === 1) {
    col = result[4].toUpperCase().charCodeAt(0) - 65
  } else {
    col = result[4].split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }

  let sheet
  if (result[2]) {
    sheet = sheetMapping.fetch(result[2])
  } else if (overrideSheet !== undefined) {
    sheet = overrideSheet
  } else {
    sheet = baseAddress.sheet
  }

  const row = Number(result[6] as string) - 1
  if (result[3] === '$' && result[5] === '$') {
    return CellAddress.absolute(sheet, col, row)
  } else if (result[3] === '$') {
    return CellAddress.absoluteCol(sheet, col, row - baseAddress.row)
  } else if (result[5] === '$') {
    return CellAddress.absoluteRow(sheet, col - baseAddress.col, row)
  } else {
    return CellAddress.relative(sheet, col - baseAddress.col, row - baseAddress.row)
  }
}

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
