import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {CellAddress} from './CellAddress'

export type SheetMappingFn = (sheetName: string) => number | undefined

/**
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param baseAddress - base address for R0C0 conversion
 */
export const cellAddressFromString = (sheetMapping: SheetMappingFn, stringAddress: string, baseAddress: SimpleCellAddress, overrideSheet?: number): CellAddress | undefined => {
  const result = stringAddress.match(/^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/)!

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
    sheet = sheetMapping(result[2])
  } else if (overrideSheet !== undefined) {
    sheet = overrideSheet
  } else {
    sheet = baseAddress.sheet
  }

  if (sheet === undefined) {
    return undefined
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
