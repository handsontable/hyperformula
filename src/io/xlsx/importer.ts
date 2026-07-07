/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Cell, Workbook, Worksheet} from 'exceljs'
import {RawCellContent} from '../../CellContentParser'
import {Sheet, Sheets} from '../../Sheet'

/**
 * Converts an already-loaded ExcelJS {@link Workbook} into HyperFormula's
 * {@link Sheets} shape.
 *
 * Pure and synchronous: byte-loading happens upstream in `loadXlsxWorkbook`.
 *
 * v1 mapping (deliberately minimal, see HF-107 task brief):
 * - a formula cell (`cell.formula != null`) becomes the string `'=' + formula`.
 * - `null`/`undefined` values become `null`.
 * - a `Date` value passes through as-is (best-effort).
 * - `number` | `string` | `boolean` pass through as-is.
 * - any other (object-valued: error / rich text / hyperlink) cell falls back
 *   to `cell.text` so we never emit the raw object.
 *
 * Shared/array formulas, `_xlfn.` prefix normalization, and a full Excel/HF
 * error-token table are out of scope here (deferred).
 */
export function workbookToSheets(workbook: Workbook): Sheets {
  const sheets: Sheets = {}

  workbook.eachSheet((worksheet: Worksheet) => {
    sheets[worksheet.name] = worksheetToSheet(worksheet)
  })

  return sheets
}

/**
 * Builds a rectangular {@link Sheet} from a worksheet's used range
 * (1..rowCount x 1..columnCount), mapping ExcelJS's 1-based coordinates to
 * the 0-based array.
 */
function worksheetToSheet(worksheet: Worksheet): Sheet {
  const rowCount = worksheet.rowCount ?? 0
  const columnCount = worksheet.columnCount ?? 0

  if (rowCount === 0) {
    return []
  }

  const sheet: Sheet = []

  for (let r = 1; r <= rowCount; r++) {
    const row = worksheet.getRow(r)
    const rowContent: RawCellContent[] = []

    for (let c = 1; c <= columnCount; c++) {
      rowContent.push(cellToRawContent(row.getCell(c)))
    }

    sheet.push(rowContent)
  }

  return sheet
}

/** Maps a single ExcelJS cell to a HyperFormula {@link RawCellContent} per the v1 mapping rule. */
function cellToRawContent(cell: Cell): RawCellContent {
  if (cell.formula != null) {
    return '=' + cell.formula
  }

  const value = cell.value

  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }

  return cell.text ?? null
}
