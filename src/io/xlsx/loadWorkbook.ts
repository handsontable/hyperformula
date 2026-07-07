/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Workbook} from 'exceljs'
import {UnsupportedFileError} from '../../errors'

/**
 * Loads raw xlsx bytes into an ExcelJS {@link Workbook}.
 *
 * v1 scope: attempt the ExcelJS load and wrap any failure. Byte-signature /
 * ZIP-magic / CFB format detection is deliberately out of scope (YAGNI).
 */
export async function loadXlsxWorkbook(data: ArrayBuffer | Uint8Array): Promise<Workbook> {
  if (data.byteLength === 0) {
    throw new UnsupportedFileError('empty')
  }

  const buffer = Buffer.from(data)

  try {
    const workbook = new Workbook()
    await workbook.xlsx.load(buffer)
    return workbook
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new UnsupportedFileError('unparseable', detail)
  }
}
