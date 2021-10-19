/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
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

    this.numberPattern = new RegExp(`^([+-]?((${decimalSeparator}\\d+)|(\\d+(${thousandSeparator}\\d{3,})*(${decimalSeparator}\\d*)?)))(e[+-]?\\d+)?$`)
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
