/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  translationPackage: TranslationPackage,
  errorMapping: Record<string, ErrorType>,
  maxColumns: number,
  maxRows: number,
}
