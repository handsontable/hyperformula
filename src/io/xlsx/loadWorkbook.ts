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

  const bytes = toStandaloneBytes(data)

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

/**
 * Returns a zero-offset `Uint8Array` whose `ArrayBuffer` holds exactly the
 * caller's logical bytes, so that `.buffer` can be handed to ExcelJS as-is.
 *
 * A `Uint8Array` argument may be a *view* into a larger buffer whose remaining
 * bytes belong to someone else — in Node every small `Buffer` is carved out of a
 * shared allocation pool — and passing that buffer on would let ExcelJS parse
 * the neighbouring bytes instead. A `.xlsx` file is a ZIP, located by scanning
 * backwards for its end-of-central-directory record, so a trailing foreign
 * workbook wins silently: one import then resolves to another import's content.
 *
 * The view therefore has to be copied out. Neither `Buffer.prototype.slice` (an
 * alias of `subarray`) nor `subarray` does that, and the Node `Buffer` API is
 * avoided altogether because it pulls webpack's `Buffer` polyfill into the
 * browser bundles; `set()` on a freshly allocated array works on both targets.
 *
 * An `ArrayBuffer` argument needs no copy: it is standalone by definition, and
 * all of it is the file.
 */
function toStandaloneBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (!(data instanceof Uint8Array)) {
    return new Uint8Array(data)
  }

  const bytes = new Uint8Array(data.byteLength)
  bytes.set(data)

  return bytes
}
