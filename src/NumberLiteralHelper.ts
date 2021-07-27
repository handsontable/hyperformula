/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Config} from './Config'
import {Destructable} from './Destructable'
import {Maybe} from './Maybe'

export class NumberLiteralHelper extends Destructable {
  private readonly numberPattern: RegExp
  private readonly allThousandSeparatorsRegex: RegExp

  constructor(
    private readonly config: Config
  ) {
    super()
    const thousandSeparator = this.config.thousandSeparator === '.' ? `\\${this.config.thousandSeparator}` : this.config.thousandSeparator
    const decimalSeparator = this.config.decimalSeparator === '.' ? `\\${this.config.decimalSeparator}` : this.config.decimalSeparator

    this.numberPattern = new RegExp(`^([+-]?((${decimalSeparator}\\d+)|(\\d+(${thousandSeparator}\\d{3,})*(${decimalSeparator}\\d*)?)))(e[+-]?\\d+)?$`)
    this.allThousandSeparatorsRegex = new RegExp(`${thousandSeparator}`, 'g')
  }

  public numericStringToMaybeNumber(input: string): Maybe<number> {
    if(this.numberPattern.test(input)) {
      const num = this.numericStringToNumber(input)
      if(isNaN(num)) {
        return undefined
      }
    return num
    }
    return undefined
  }

  public isNumber(input: string): boolean {
    if (this.numberPattern.test(input)) {
      return !isNaN(this.numericStringToNumber(input))
    }
    return false
  }

  public numericStringToNumber(input: string): number {
    const normalized = input
      .replace(this.allThousandSeparatorsRegex, '')
      .replace(this.config.decimalSeparator, '.')
    return Number(normalized)
  }
}
