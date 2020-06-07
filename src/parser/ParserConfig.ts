/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType, TranslatableErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  translationPackage: TranslationPackage,
  errorMapping: Record<string, TranslatableErrorType>,
  maxColumns: number,
  maxRows: number,
}
