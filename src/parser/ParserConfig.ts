/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {TranslatableErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  arrayColumnSeparator: ',' | ';',
  arrayRowSeparator: ';' | '|',
  allowAllWhitespace: boolean,
  translationPackage: TranslationPackage,
  errorMapping: Record<string, TranslatableErrorType>,
  maxColumns: number,
  maxRows: number,
}
