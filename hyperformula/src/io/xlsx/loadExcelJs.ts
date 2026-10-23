/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import type * as ExcelJS from 'exceljs'

export type ExcelJsApi = typeof ExcelJS

/**
 * Picks the ExcelJS API out of whatever a dynamic `import('exceljs')` resolved to.
 *
 * ExcelJS is a CommonJS package that assigns its whole API to `module.exports`. Node's native
 * dynamic `import()`, which the published `commonjs` and `es` builds use, exposes that object only
 * as the `default` export, while bundlers and CommonJS transpilers also copy its members onto the
 * module namespace. Both shapes are accepted.
 */
export function pickExcelJsApi(module: ExcelJsApi | { default: ExcelJsApi }): ExcelJsApi {
  return 'Workbook' in module ? module : module.default
}

/**
 * Loads ExcelJS on demand, so that it is needed only by the methods that read or write `.xlsx` files.
 */
export async function loadExcelJs(): Promise<ExcelJsApi> {
  return pickExcelJsApi(await import(/* webpackMode: "eager" */ 'exceljs'))
}
