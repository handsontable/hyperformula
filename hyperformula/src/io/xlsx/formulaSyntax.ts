/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from '../../Config'
import {ConfigParams} from '../../ConfigParams'

type FormulaSyntaxParams = Pick<ConfigParams, 'language' | 'functionArgSeparator' | 'decimalSeparator' | 'thousandSeparator' | 'arrayColumnSeparator' | 'arrayRowSeparator'>

/**
 * The formula syntax of an `.xlsx` file: English function names, `,` between arguments and between
 * the columns of an array, `;` between its rows, and `.` as the decimal separator. The file format
 * fixes it, whatever language and separators an engine is configured with.
 */
export const XLSX_FORMULA_SYNTAX: FormulaSyntaxParams = {
  language: 'enGB',
  functionArgSeparator: ',',
  decimalSeparator: '.',
  thousandSeparator: '',
  arrayColumnSeparator: ',',
  arrayRowSeparator: ';',
}

/**
 * Returns the options of `configInput` that decide how formulas are written, with the defaults
 * filled in for the ones it leaves out.
 */
export function formulaSyntaxOf(configInput: Partial<ConfigParams>): FormulaSyntaxParams {
  const syntax = {...XLSX_FORMULA_SYNTAX}

  for (const key of Object.keys(XLSX_FORMULA_SYNTAX) as (keyof FormulaSyntaxParams)[]) {
    const value = configInput[key] ?? Config.defaultConfig[key]
    Object.assign(syntax, {[key]: value})
  }

  return syntax
}

/** Returns `true` when an engine built with `configInput` reads and writes formulas in the syntax of an `.xlsx` file. */
export function hasXlsxFormulaSyntax(configInput: Partial<ConfigParams>): boolean {
  const syntax = formulaSyntaxOf(configInput)
  return (Object.keys(XLSX_FORMULA_SYNTAX) as (keyof FormulaSyntaxParams)[]).every(key => syntax[key] === XLSX_FORMULA_SYNTAX[key])
}
