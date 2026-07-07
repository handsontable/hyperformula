/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Workbook} from 'exceljs'
import {RawCellContent} from '../../CellContentParser'

/**
 * Converts HF's serialized sheets (as returned by
 * {@link HyperFormula#getAllSheetsSerialized}) into `.xlsx` file bytes.
 *
 * Pure and async (ExcelJS's writer is async); does not touch a live engine.
 *
 * v1 mapping (deliberately minimal, see HF-107 task brief):
 * - a `null`/`undefined` cell is left unset, so it reloads blank (not `0`/`''`).
 * - a formula string (`cell[0] === '='`) becomes an ExcelJS formula cell.
 * - `number` | `string` | `boolean` | `Date` pass through as-is.
 *
 * Values and formulas only &mdash; no styles, number formats, or merged cells.
 */
export async function sheetsToXlsx(sheets: Record<string, RawCellContent[][]>): Promise<Uint8Array> {
  const workbook = new Workbook()

  for (const sheetName of Object.keys(sheets)) {
    const worksheet = workbook.addWorksheet(sheetName)
    const rows = sheets[sheetName]

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
          xc.value = cell
        }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Uint8Array.from(buffer as Buffer)
}
