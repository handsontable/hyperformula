/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from './Config'
import {Maybe} from './Maybe'

export class NumberLiteralHelper {
  private readonly numberPattern: RegExp
  private readonly allThousandSeparatorsRegex: RegExp

  constructor(
    private readonly config: Config
  ) {
    const thousandSeparator = this.config.thousandSeparator === '.' ? `\\${this.config.thousandSeparator}` : this.config.thousandSeparator
    const decimalSeparator = this.config.decimalSeparator === '.' ? `\\${this.config.decimalSeparator}` : this.config.decimalSeparator

    // When thousandSeparator is empty (the default), the group `(sep\d{3,})*` degenerates to
    // `(\d{3,})*` adjacent to `\d+`, which causes catastrophic backtracking (ReDoS) on a long
    // run of digits that ultimately fails to match. Omit the group entirely in that case. (DEV-2120)
    const thousandSeparatorGroup = this.config.thousandSeparator === '' ? '' : `(${thousandSeparator}\\d{3,})*`
    this.numberPattern = new RegExp(`^([+-]?((${decimalSeparator}\\d+)|(\\d+${thousandSeparatorGroup}(${decimalSeparator}\\d*)?)))([eE][+-]?\\d+)?$`)
    this.allThousandSeparatorsRegex = new RegExp(`${thousandSeparator}`, 'g')
  }

  public numericStringToMaybeNumber(input: string): Maybe<number> {
    if (this.numberPattern.test(input)) {
      const num = this.numericStringToNumber(input)
      if (isNaN(num)) {
        return undefined
      }
      return num
    }

    return undefined
  }

  public numericStringToNumber(input: string): number {
    const normalized = input
      .replace(this.allThousandSeparatorsRegex, '')
      .replace(this.config.decimalSeparator, '.')
    return Number(normalized)
  }
}
