/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from './Config'
import {Maybe} from './Maybe'
import {Numeric, NumericProvider} from './Numeric'

/**
 *
 */
export class NumberLiteralHelper {
  private readonly numberPattern: RegExp
  private readonly allThousandSeparatorsRegex: RegExp
  private readonly precisionProvider: NumericProvider

  constructor(
    private readonly config: Config,
    precisionProvider?: NumericProvider
  ) {
    const thousandSeparator = this.config.thousandSeparator === '.' ? `\\${this.config.thousandSeparator}` : this.config.thousandSeparator
    const decimalSeparator = this.config.decimalSeparator === '.' ? `\\${this.config.decimalSeparator}` : this.config.decimalSeparator

    this.numberPattern = new RegExp(`^([+-]?((${decimalSeparator}\\d+)|(\\d+(${thousandSeparator}\\d{3,})*(${decimalSeparator}\\d*)?)))(e[+-]?\\d+)?$`)
    this.allThousandSeparatorsRegex = new RegExp(`${thousandSeparator}`, 'g')
    this.precisionProvider = precisionProvider ?? new NumericProvider()
  }

  /**
   * Attempts to parse a numeric string to an Numeric.
   * Returns undefined if the string is not a valid number.
   * @param input The string to parse
   */
  public numericStringToMaybeNumber(input: string): Maybe<Numeric> {
    if (this.numberPattern.test(input)) {
      const num = this.numericStringToNumber(input)
      if (num.isNaN()) {
        return undefined
      }
      return num
    }

    return undefined
  }

  /**
   * Parses a numeric string to an Numeric.
   * The string is normalized (thousands separators removed, decimal separator standardized).
   * @param input The string to parse
   */
  public numericStringToNumber(input: string): Numeric {
    const normalized = input
      .replace(this.allThousandSeparatorsRegex, '')
      .replace(this.config.decimalSeparator, '.')
    return this.precisionProvider.fromString(normalized)
  }
}
