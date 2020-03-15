import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {CellAddress, CellReferenceType} from './CellAddress'
import {additionalCharactersAllowedInQuotes} from './LexerConfig'

export type SheetMappingFn = (sheetName: string) => Maybe<number>
export type SheetIndexMappingFn = (sheetIndex: number) => Maybe<string>

const addressRegex = new RegExp(`^((([A-Za-z0-9_\u00C0-\u02AF]+)|'([A-Za-z0-9${additionalCharactersAllowedInQuotes}_\u00C0-\u02AF]+)')!)?(\\$?)([A-Za-z]+)(\\$?)([0-9]+)\$`)

/**
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param sheetMapping - mapping function needed to change name of a sheet to index
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param baseAddress - base address for R0C0 conversion
 * @returns object representation of address
 */
export const cellAddressFromString = (sheetMapping: SheetMappingFn, stringAddress: string, baseAddress: SimpleCellAddress): Maybe<CellAddress> => {
  const result = addressRegex.exec(stringAddress)!

  const col = columnLabelToIndex(result[6])

  const maybeSheetName = result[3] || result[4]

  let sheet = null

  if (maybeSheetName) {
    sheet = sheetMapping(maybeSheetName)
    if (sheet === undefined) {
      return undefined
    }
  }

  const row = Number(result[8]) - 1
  if (result[5] === '$' && result[7] === '$') {
    return CellAddress.absolute(sheet, col, row)
  } else if (result[5] === '$') {
    return CellAddress.absoluteCol(sheet, col, row - baseAddress.row)
  } else if (result[7] === '$') {
    return CellAddress.absoluteRow(sheet, col - baseAddress.col, row)
  } else {
    return CellAddress.relative(sheet, col - baseAddress.col, row - baseAddress.row)
  }
}

export const cellAddressToString = (address: CellAddress, baseAddress: SimpleCellAddress): string => {
  const simpleAddress = address.toSimpleCellAddress(baseAddress)
  const column = columnIndexToLabel(simpleAddress.col)
  const rowDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW ? '$' : ''
  const colDolar = address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE || address.type === CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL ? '$' : ''
  return `${colDolar}${column}${rowDolar}${simpleAddress.row + 1}`
}

/**
 * Computes simple (absolute) address of a cell address based on it's string representation.
 * If sheet name present in string representation but is not present in sheet mapping, returns undefined.
 * If sheet name is not present in string representation, returns {@param sheetContext} as sheet number
 *
 * @param sheetMapping - mapping function needed to change name of a sheet to index
 * @param stringAddress - string representation of cell address, e.g. 'C64'
 * @param sheetContext - sheet in context of which we should parse the address
 * @returns absolute representation of address, e.g. { sheet: 0, col: 1, row: 1 }
 */
export const simpleCellAddressFromString = (sheetMapping: SheetMappingFn, stringAddress: string, sheetContext: number): Maybe<SimpleCellAddress> => {
  const result = addressRegex.exec(stringAddress)!

  const col = columnLabelToIndex(result[6])

  const maybeSheetName = result[3] || result[4]
  let sheet
  if (maybeSheetName) {
    sheet = sheetMapping(maybeSheetName)
  } else {
    sheet = sheetContext
  }

  if (sheet === undefined) {
    return undefined
  }

  const row = Number(result[8]) - 1
  return simpleCellAddress(sheet, col, row)
}

/**
 * Returns string representation of absolute address
 * If sheet index is not present in sheet mapping, returns undefined
 *
 * @param sheetIndexMapping - mapping function needed to change sheet index to sheet name
 * @param address - object representation of absolute address
 * @param sheetIndex - if is not equal with address sheet index, string representation will contain sheet name
 * */
export const simpleCellAddressToString = (sheetIndexMapping: SheetIndexMappingFn, address: SimpleCellAddress, sheetIndex: number): Maybe<string> => {
  const column = columnIndexToLabel(address.col)
  const sheetName = sheetIndexMapping(address.sheet)

  if (sheetName === undefined) {
    return undefined
  }

  if (sheetIndex !== address.sheet) {
    return `${sheetName}!${column}${address.row + 1}`
  } else {
    return `${column}${address.row + 1}`
  }
}

/**
* Convert column label to index
*
* @param columnStringRepresentation - column label (e.g. 'AAB')
* @returns column index
* */
function columnLabelToIndex(columnStringRepresentation: string): number {
  if (columnStringRepresentation.length === 1) {
    return columnStringRepresentation.toUpperCase().charCodeAt(0) - 65
  } else {
    return columnStringRepresentation.split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }
}

/**
 * Converts column index to label
 *
 * @param column - address to convert
 * @returns string representation, e.g. 'AAB'
 */
function columnIndexToLabel(column: number) {
  let result = ''

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result
    column = Math.floor(column / 26) - 1
  }

  return result.toUpperCase()
}
