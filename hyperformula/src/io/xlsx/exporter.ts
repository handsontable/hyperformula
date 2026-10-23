/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import type {CellErrorValue} from 'exceljs'
import {ErrorType} from '../../Cell'
import {RawCellContent} from '../../CellContentParser'
import {CellValue, DetailedCellError} from '../../CellValue'
import {loadExcelJs} from './loadExcelJs'

/**
 * Writes HyperFormula's sheets as `.xlsx` file bytes.
 *
 * Pure and async (ExcelJS's writer is async); does not touch a live engine.
 *
 * Both arguments are keyed by sheet name. `formulas` holds the serialized cells, as returned by
 * {@link HyperFormula#getAllSheetsSerialized}, with the formulas already in Excel's syntax, and
 * `values` the computed values, as returned by {@link HyperFormula#getAllSheetsValues}:
 * - a cell whose serialized content is a formula (starts with `=`) becomes an Excel formula cell.
 * - a cell whose serialized content is empty is left unset, so it reloads blank (not `0`/`''`).
 *   This also covers the cells a formula's array result spills into.
 * - any other cell is written as its computed value, so a number or a boolean entered as text
 *   (for example `'1'`) is written as a number or a boolean, and a text value is written without
 *   the `'` that marks it as text in HyperFormula.
 *
 * Values and formulas only &mdash; no styles, number formats, or merged cells.
 */
export async function sheetsToXlsx(formulas: Record<string, RawCellContent[][]>, values: Record<string, CellValue[][]>): Promise<Uint8Array> {
  const ExcelJS = await loadExcelJs()
  const workbook = new ExcelJS.Workbook()

  for (const sheetName of Object.keys(formulas)) {
    const worksheet = workbook.addWorksheet(sheetName)
    const rows = formulas[sheetName]
    const valueRows = values[sheetName] ?? []

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]

      for (let c = 0; c < row.length; c++) {
        const cell = row[c]

        if (cell == null) {
          continue
        }

        const xc = worksheet.getCell(r + 1, c + 1)

        if (typeof cell === 'string' && cell[0] === '=') {
          xc.value = {formula: cell.slice(1)}
        } else {
          xc.value = toExcelValue(valueRows[r]?.[c] ?? null)
        }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  // ExcelJS returns a Node `Buffer` in Node and an `ArrayBuffer` in the browser.
  // `Uint8Array.from()` treats an `ArrayBuffer` as an empty array-like and silently
  // drops the bytes, corrupting browser exports; `new Uint8Array(...)` copies a
  // Buffer and views an ArrayBuffer, so it is correct on both targets.
  return buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as Uint8Array)
}

/** Maps a computed HyperFormula value to the value of an ExcelJS cell. */
function toExcelValue(value: CellValue): number | string | boolean | CellErrorValue | null {
  if (value instanceof DetailedCellError) {
    const excelError = toExcelError(value.type)
    return excelError === undefined ? value.value : {error: excelError}
  }

  return value
}

/**
 * Returns the Excel error value a HyperFormula error type is written as, or `undefined` for the
 * error types Excel does not have, which are written as the text of the error instead.
 */
function toExcelError(type: ErrorType): CellErrorValue['error'] | undefined {
  switch (type) {
    case ErrorType.DIV_BY_ZERO:
      return '#DIV/0!'
    case ErrorType.NA:
      return '#N/A'
    case ErrorType.NAME:
      return '#NAME?'
    case ErrorType.NUM:
      return '#NUM!'
    case ErrorType.REF:
      return '#REF!'
    case ErrorType.VALUE:
      return '#VALUE!'
    default:
      return undefined
  }
}
