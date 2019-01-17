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

export type CellValue = boolean | string | number | CellError

export interface CellAddress {
  col: number,
  row: number,
  type: CellReferenceType
}

export const relativeCellAddress = (col: number, row: number): CellAddress => ({ col, row, type: CellReferenceType.CELL_REFERENCE_RELATIVE })
export const absoluteCellAddress = (col: number, row: number): CellAddress => ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE })
export const absoluteColCellAddress = (col: number, row: number): CellAddress => ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL })
export const absoluteRowCellAddress = (col: number, row: number): CellAddress => ({ col, row, type: CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW })

export interface SimpleCellAddress {
  col: number,
  row: number,
}

export const simpleCellAddress = (col: number, row: number): SimpleCellAddress => ({ col, row })

export type CellDependency = SimpleCellAddress | [SimpleCellAddress, SimpleCellAddress]

/**
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param baseAddress - base address for R0C0 conversion
 */
export const cellAddressFromString = (stringAddress: string, baseAddress: SimpleCellAddress): CellAddress => {
  const result = stringAddress.match(/(\$?)([A-Za-z]+)(\$?)([0-9]+)/)!

  let col
  if (result[2].length === 1) {
    col = result[2].toUpperCase().charCodeAt(0) - 65
  } else {
    col = result[2].split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }

  const row = Number(result[4] as string) - 1
  if (result[1] === '$' && result[3] === '$') {
    return absoluteCellAddress(col, row)
  } else if (result[1] === '$') {
    return absoluteColCellAddress(col, row - baseAddress.row)
  } else if (result[3] === '$') {
    return absoluteRowCellAddress(col - baseAddress.col, row)
  } else {
    return relativeCellAddress(col - baseAddress.col, row - baseAddress.row)
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
    return simpleCellAddress(baseAddress.col + address.col, address.row)
  } else if (address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL) {
    return simpleCellAddress(address.col, baseAddress.row + address.row)
  } else {
    return simpleCellAddress(baseAddress.col + address.col, baseAddress.row + address.row)
  }
}

/**
 * Converts simple object representation of cell address to string representation.
 *
 * @param address - address to convert
 * @returns string representation, e.g. 'C64'
 */
export function cellAddressToString(address: SimpleCellAddress): string {
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

export interface SimpleCellRange {
  start: SimpleCellAddress,
  end: SimpleCellAddress,
}
export const simpleCellRange = (start: SimpleCellAddress, end: SimpleCellAddress): SimpleCellRange => ({ start, end })

export function cellRangeToSimpleCellRange(cellRange: CellRange, baseAddress: SimpleCellAddress) {
  return simpleCellRange(getAbsoluteAddress(cellRange.start, baseAddress), getAbsoluteAddress(cellRange.end, baseAddress))
}

export const rangeWidth = (simpleCellRange: SimpleCellRange) => {
  return simpleCellRange.end.col - simpleCellRange.start.col
}

export const rangeHeight = (simpleCellRange: SimpleCellRange) => {
  return simpleCellRange.end.row - simpleCellRange.start.row
}
