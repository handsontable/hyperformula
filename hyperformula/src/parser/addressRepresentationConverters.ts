/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteColumnRange, AbsoluteRowRange, simpleCellRange, SimpleCellRange} from '../AbsoluteCellRange'
import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {CellAddress} from './CellAddress'
import {ColumnAddress} from './ColumnAddress'
import {ABSOLUTE_OPERATOR, RANGE_OPERATOR, SHEET_NAME_PATTERN, UNQUOTED_SHEET_NAME_PATTERN} from './parser-consts'
import {RowAddress} from './RowAddress'

export type SheetIndexMappingFn = (sheetIndex: number) => Maybe<string>
export type ResolveSheetReferenceFn = (sheetName: string) => Maybe<number>

const addressRegex = new RegExp(`^(${SHEET_NAME_PATTERN})?(\\${ABSOLUTE_OPERATOR}?)([A-Za-z]+)(\\${ABSOLUTE_OPERATOR}?)([0-9]+)$`)
const columnRegex = new RegExp(`^(${SHEET_NAME_PATTERN})?(\\${ABSOLUTE_OPERATOR}?)([A-Za-z]+)$`)
const rowRegex = new RegExp(`^(${SHEET_NAME_PATTERN})?(\\${ABSOLUTE_OPERATOR}?)([0-9]+)$`)
const simpleSheetNameRegex = new RegExp(`^${UNQUOTED_SHEET_NAME_PATTERN}$`)

/**
 * Computes R0C0 representation of cell address based on it's string representation and base address.
 *
 * @param {string} stringAddress - string representation of cell address, e.g., 'C64'
 * @param {SimpleCellAddress} baseAddress - base address for R0C0 conversion
 * @param {ResolveSheetReferenceFn} resolveSheetReference - mapping function needed to change name of a sheet to index
 * @returns {Maybe<CellAddress>} object representation of address or `undefined` if the sheet cannot be resolved
 */
export const cellAddressFromString = (stringAddress: string, baseAddress: SimpleCellAddress, resolveSheetReference: ResolveSheetReferenceFn): Maybe<CellAddress> => {
  const result = addressRegex.exec(stringAddress)

  if (!result) {
    return undefined
  }

  const col = columnLabelToIndex(result[6])
  const row = Number(result[8]) - 1
  const sheetName = extractSheetName(result)
  const sheet = sheetNameToId(sheetName, resolveSheetReference)

  if (sheet === null) {
    return undefined
  }

  if (result[5] === ABSOLUTE_OPERATOR && result[7] === ABSOLUTE_OPERATOR) {
    return CellAddress.absolute(col, row, sheet)
  } else if (result[5] === ABSOLUTE_OPERATOR) {
    return CellAddress.absoluteCol(col, row - baseAddress.row, sheet)
  } else if (result[7] === ABSOLUTE_OPERATOR) {
    return CellAddress.absoluteRow(col - baseAddress.col, row, sheet)
  } else {
    return CellAddress.relative(col - baseAddress.col, row - baseAddress.row, sheet)
  }
}

export const columnAddressFromString = (stringAddress: string, baseAddress: SimpleCellAddress, resolveSheetReference: ResolveSheetReferenceFn): Maybe<ColumnAddress> => {
  const result = columnRegex.exec(stringAddress)

  if (!result) {
    return undefined
  }

  const col = columnLabelToIndex(result[6])
  const sheetName = extractSheetName(result)
  const sheet = sheetNameToId(sheetName, resolveSheetReference)

  if (sheet === null) {
    return undefined
  }

  if (result[5] === ABSOLUTE_OPERATOR) {
    return ColumnAddress.absolute(col, sheet)
  } else {
    return ColumnAddress.relative(col - baseAddress.col, sheet)
  }
}

export const rowAddressFromString = (stringAddress: string, baseAddress: SimpleCellAddress, resolveSheetReference: ResolveSheetReferenceFn): Maybe<RowAddress> => {
  const result = rowRegex.exec(stringAddress)

  if (!result) {
    return undefined
  }

  const row = Number(result[6]) - 1
  const sheetName = extractSheetName(result)
  const sheet = sheetNameToId(sheetName, resolveSheetReference)

  if (sheet === null) {
    return undefined
  }

  if (result[5] === ABSOLUTE_OPERATOR) {
    return RowAddress.absolute(row, sheet)
  } else {
    return RowAddress.relative(row - baseAddress.row, sheet)
  }
}

/**
 * Computes simple (absolute) address of a cell address based on its string representation.
 * - If sheet name is present in the string representation but is not present in sheet mapping, returns `undefined`.
 * - If sheet name is not present in the string representation, returns {@param contextSheetId} as sheet number.
 *
 * @param {ResolveSheetReferenceFn} resolveSheetReference - mapping function needed to change name of a sheet to index
 * @param {string} stringAddress - string representation of cell address, e.g., 'C64'
 * @param {number} contextSheetId - sheet in context of which we should parse the address
 * @returns {Maybe<SimpleCellAddress>} absolute representation of address, e.g., { sheet: 0, col: 1, row: 1 }
 */
export const simpleCellAddressFromString = (resolveSheetReference: ResolveSheetReferenceFn, stringAddress: string, contextSheetId: number): Maybe<SimpleCellAddress> => {
  const regExpExecArray = addressRegex.exec(stringAddress)

  if (!regExpExecArray) {
    return undefined
  }

  const col = columnLabelToIndex(regExpExecArray[6])
  const row = Number(regExpExecArray[8]) - 1
  const sheetName = extractSheetName(regExpExecArray)
  const sheet = sheetNameToId(sheetName, resolveSheetReference)

  if (sheet === null) {
    return undefined
  }

  const effectiveSheet = sheet === undefined ? contextSheetId : sheet

  return simpleCellAddress(effectiveSheet, col, row)
}

export const simpleCellRangeFromString = (resolveSheetReference: ResolveSheetReferenceFn, stringAddress: string, contextSheetId: number): Maybe<SimpleCellRange> => {
  const split = stringAddress.split(RANGE_OPERATOR)
  if (split.length !== 2) {
    return undefined
  }
  const [startString, endString] = split
  const start = simpleCellAddressFromString(resolveSheetReference, startString, contextSheetId)
  if (start === undefined) {
    return undefined
  }
  const end = simpleCellAddressFromString(resolveSheetReference, endString, start.sheet)
  if (end === undefined) {
    return undefined
  }
  if (start.sheet !== end.sheet) {
    return undefined
  }
  return simpleCellRange(start, end)
}

/**
 * Computes the absolute range of whole columns from its string representation, e.g., 'B:C' or 'Sheet2!$B:C', with the
 * ends in the order given. Absolute markers are ignored. The sheet works as in {@link simpleCellRangeFromString}.
 *
 * @param {ResolveSheetReferenceFn} resolveSheetReference - mapping function needed to change name of a sheet to index
 * @param {string} stringAddress - string representation of the range
 * @param {number} contextSheetId - sheet of the range if the string does not name one
 * @returns {Maybe<SimpleCellRange>} the columns as an {@link AbsoluteColumnRange}, or `undefined` if the string is
 * not a range of whole columns, names a sheet that does not exist, or names two different sheets
 */
export const simpleColumnRangeFromString = (resolveSheetReference: ResolveSheetReferenceFn, stringAddress: string, contextSheetId: number): Maybe<SimpleCellRange> => {
  const ends = rangeEndsFromString(columnRegex, resolveSheetReference, stringAddress, contextSheetId)
  if (ends === undefined) {
    return undefined
  }
  return new AbsoluteColumnRange(ends.sheet, columnLabelToIndex(ends.start), columnLabelToIndex(ends.end))
}

/**
 * Computes the absolute range of whole rows from its string representation, e.g., '2:3' or 'Sheet2!$2:3', with the
 * ends in the order given. Absolute markers are ignored. The sheet works as in {@link simpleCellRangeFromString}.
 *
 * @param {ResolveSheetReferenceFn} resolveSheetReference - mapping function needed to change name of a sheet to index
 * @param {string} stringAddress - string representation of the range
 * @param {number} contextSheetId - sheet of the range if the string does not name one
 * @returns {Maybe<SimpleCellRange>} the rows as an {@link AbsoluteRowRange}, or `undefined` if the string is not a
 * range of whole rows, names a sheet that does not exist, or names two different sheets
 */
export const simpleRowRangeFromString = (resolveSheetReference: ResolveSheetReferenceFn, stringAddress: string, contextSheetId: number): Maybe<SimpleCellRange> => {
  const ends = rangeEndsFromString(rowRegex, resolveSheetReference, stringAddress, contextSheetId)
  if (ends === undefined) {
    return undefined
  }
  return new AbsoluteRowRange(ends.sheet, Number(ends.start) - 1, Number(ends.end) - 1)
}

/**
 * Splits a range of whole columns or whole rows into its two ends, each of which must match the given pattern
 * (columnRegex or rowRegex), and resolves its sheet as {@link simpleCellRangeFromString} does: the sheet named at the
 * start, or else the context sheet; the end may name only that sheet. Returns the sheet and the column labels or row
 * numbers of the two ends as written, or `undefined` if the string is not such a range or a sheet in it does not exist.
 */
function rangeEndsFromString(pattern: RegExp, resolveSheetReference: ResolveSheetReferenceFn, stringAddress: string, contextSheetId: number): Maybe<{ sheet: number, start: string, end: string }> {
  const split = stringAddress.split(RANGE_OPERATOR)
  if (split.length !== 2) {
    return undefined
  }
  const start = pattern.exec(split[0])
  const end = pattern.exec(split[1])
  if (start === null || end === null) {
    return undefined
  }
  const startSheet = sheetNameToId(extractSheetName(start), resolveSheetReference)
  const endSheet = sheetNameToId(extractSheetName(end), resolveSheetReference)
  if (startSheet === null || endSheet === null) {
    return undefined
  }
  const sheet = startSheet ?? contextSheetId
  if ((endSheet ?? sheet) !== sheet) {
    return undefined
  }
  // group 6 of columnRegex and rowRegex is the column label or the row number, after the sheet name and the '$'
  return {sheet, start: start[6], end: end[6]}
}

/**
 * Returns string representation of absolute address
 * If sheet index is not present in sheet mapping, returns undefined
 */
export const simpleCellAddressToString = (sheetIndexMapping: SheetIndexMappingFn, address: SimpleCellAddress, sheetIndex: number): Maybe<string> => {
  const column = columnIndexToLabel(address.col)
  const sheetName = sheetIndexToString(address.sheet, sheetIndexMapping)

  if (sheetName === undefined) {
    return undefined
  }

  if (sheetIndex !== address.sheet) {
    return `${sheetName}!${column}${address.row + 1}`
  } else {
    return `${column}${address.row + 1}`
  }
}

export const simpleCellRangeToString = (sheetIndexMapping: SheetIndexMappingFn, address: SimpleCellRange, sheetIndex: number): Maybe<string> => {
  const startString = simpleCellAddressToString(sheetIndexMapping, address.start, sheetIndex)
  const endString = simpleCellAddressToString(sheetIndexMapping, address.end, address.start.sheet)
  if (startString === undefined || endString === undefined) {
    return undefined
  } else {
    return `${startString}${RANGE_OPERATOR}${endString}`
  }
}

/**
 * Convert column label to index
 *
 * @param columnStringRepresentation - column label (e.g., 'AAB')
 * @returns column index
 */
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
 * @returns string representation, e.g., 'AAB'
 */
export function columnIndexToLabel(column: number) {
  let result = ''

  while (column >= 0) {
    result = String.fromCharCode((column % 26) + 97) + result
    column = Math.floor(column / 26) - 1
  }

  return result.toUpperCase()
}

export function sheetIndexToString(sheetId: number, sheetMappingFn: SheetIndexMappingFn): Maybe<string> {
  let sheetName = sheetMappingFn(sheetId)
  if (sheetName === undefined) {
    return undefined
  }

  if (simpleSheetNameRegex.test(sheetName)) {
    return sheetName
  } else {
    sheetName = sheetName.replace(/'/g, "''")
    return `'${sheetName}'`
  }
}

function extractSheetName(regexResult: RegExpExecArray): string | null {
  const maybeSheetName = regexResult[3] ?? regexResult[2]

  return maybeSheetName ? maybeSheetName.replace(/''/g, "'") : null
}

/**
 * Resolves sheet name to sheet id.
 *
 * @param sheetName - extracted sheet name or null when not provided.
 * @param resolveSheetReference - mapping function resolving sheet name to id.
 * @returns sheet id, undefined when sheet name absent, null when resolution fails.
 */
function sheetNameToId(sheetName: string | null, resolveSheetReference: ResolveSheetReferenceFn): Maybe<number> | null {
  if (!sheetName) {
    return undefined
  }

  const sheetId = resolveSheetReference(sheetName)

  return sheetId === undefined ? null : sheetId
}
