/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {TranslatableErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  arrayColumnSeparator: ',' | ';',
  arrayRowSeparator: ';' | '|',
  ignoreWhiteSpace: 'standard' | 'any',
  translationPackage: TranslationPackage,
  errorMapping: Record<string, TranslatableErrorType>,
  maxColumns: number,
  maxRows: number,
}
