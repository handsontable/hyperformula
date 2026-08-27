/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import type {Workbook} from 'exceljs'
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

  // Copy to a fresh, zero-offset Uint8Array (works in Node and the browser
  // without pulling in the Node `Buffer` polyfill). `.slice()` on a subarray
  // view copies exactly the view's logical bytes, so byteOffset is honored.
  const bytes = data instanceof Uint8Array ? data.slice() : new Uint8Array(data)

  try {
    const ExcelJS = await import(/* webpackMode: "eager" */ 'exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes.buffer)
    return workbook
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new UnsupportedFileError('unparseable', detail)
  }
}
