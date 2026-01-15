/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {simpleCellRange, SimpleCellRange} from '../AbsoluteCellRange'
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

/**
 *
 */
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

/**
 *
 */
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
