import {Matrix, MatrixSize} from './Matrix'
import {SheetMapping} from './SheetMapping'

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

export interface CellAddress {
  col: number,
  row: number,
  sheet: number,
  type: CellReferenceType
}

export const relativeCellAddress = (sheet: number, col: number, row: number): CellAddress => ({ sheet, col, row, type: CellReferenceType.CELL_REFERENCE_RELATIVE })
export const absoluteCellAddress = (sheet: number, col: number, row: number): CellAddress => ({ sheet, col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE })
export const absoluteColCellAddress = (sheet: number, col: number, row: number): CellAddress => ({ sheet, col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL })
export const absoluteRowCellAddress = (sheet: number, col: number, row: number): CellAddress => ({ sheet, col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW })

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

export type CellDependency = SimpleCellAddress | [SimpleCellAddress, SimpleCellAddress]

/**
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param baseAddress - base address for R0C0 conversion
 */
export const cellAddressFromString = (sheetMapping: SheetMapping, stringAddress: string, baseAddress: SimpleCellAddress): CellAddress => {
  const result = stringAddress.match(/^(\$([A-Za-z0-9]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/)!

  let col
  if (result[4].length === 1) {
    col = result[4].toUpperCase().charCodeAt(0) - 65
  } else {
    col = result[4].split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }

  const sheet = result[2] ? sheetMapping.fetch(result[2]) : baseAddress.sheet
  const row = Number(result[6] as string) - 1
  if (result[3] === '$' && result[5] === '$') {
    return absoluteCellAddress(sheet, col, row)
  } else if (result[3] === '$') {
    return absoluteColCellAddress(sheet, col, row - baseAddress.row)
  } else if (result[5] === '$') {
    return absoluteRowCellAddress(sheet, col - baseAddress.col, row)
  } else {
    return relativeCellAddress(sheet, col - baseAddress.col, row - baseAddress.row)
  }
}

/**
 * Converts R0C0 representation of cell address to simple object representation.
 *
 * @param address - address in R0C0 representation
 * @param baseAddress - base address for R0C0 shifts
 */
export const getAbsoluteAddress = (address: CellAddress, baseAddress: SimpleCellAddress): SimpleCellAddress => {
  if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE) {
    return address
  } else if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
    return simpleCellAddress(address.sheet, baseAddress.col + address.col, address.row)
  } else if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
    return simpleCellAddress(address.sheet, address.col, baseAddress.row + address.row)
  } else {
    return simpleCellAddress(address.sheet, baseAddress.col + address.col, baseAddress.row + address.row)
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

export class AbsoluteCellRange {
  constructor(
    public readonly start: SimpleCellAddress,
    public readonly end: SimpleCellAddress
  ) {
  }

  public static fromCellRange(x: CellRange, baseAddress: SimpleCellAddress): AbsoluteCellRange {
    return new AbsoluteCellRange(
      getAbsoluteAddress(x.start, baseAddress),
      getAbsoluteAddress(x.end, baseAddress),
    )
  }

  public width() {
    return this.end.col - this.start.col + 1;
  }

  public height() {
    return this.end.row - this.start.row + 1;
  }

  public doesOverlap(other: AbsoluteCellRange) {
    if (this.start.sheet != other.start.sheet) {
      return true
    }
    if (this.end.row < other.start.row || this.start.row > other.end.row) {
      return false
    }
    if (this.end.col < other.start.col || this.start.col > other.end.col) {
      return false
    }
    return true
  }

  public withStart(newStart: SimpleCellAddress) {
    return new AbsoluteCellRange(newStart, this.end)
  }

  public withEnd(newEnd: SimpleCellAddress) {
    return new AbsoluteCellRange(this.start, newEnd)
  }

  public sameDimensionsAs(other: AbsoluteCellRange) {
    return this.width() === other.width() && this.height() === other.height();
  }
}
