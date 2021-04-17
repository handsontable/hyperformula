/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from './Cell'
import {Config} from './Config'
import {DateTimeHelper} from './DateTimeHelper'
import {UnableToParseError} from './errors'
import {fixNegativeZero, isNumberOverflow} from './interpreter/ArithmeticHelper'
import {
  cloneNumber,
  CurrencyNumber,
  DateNumber,
  ExtendedNumber,
  getRawValue,
  PercentNumber
} from './interpreter/InterpreterValue'
import {Maybe} from './Maybe'
import {NumberLiteralHelper} from './NumberLiteralHelper'

export type RawCellContent = Date | string | number | boolean | null | undefined

export namespace CellContent {
  export class Number {
    constructor(public readonly value: ExtendedNumber) {
      this.value = cloneNumber(this.value, fixNegativeZero(getRawValue(this.value)))
    }
  }

  export class String {
    constructor(public readonly value: string) {
    }
  }

  export class Boolean {
    constructor(public readonly value: boolean) {
    }
  }

  export class Empty {

    public static getSingletonInstance() {
      if (!Empty.instance) {
        Empty.instance = new Empty()
      }
      return Empty.instance
    }

    private static instance: Empty
  }

  export class Formula {
    constructor(public readonly formula: string) {
    }
  }

  export class MatrixFormula {
    constructor(public readonly formula: string) {
    }

    public formulaWithBraces(): string {
      return '{' + this.formula + '}'
    }
  }

  export class Error {
    public readonly value: CellError

    constructor(errorType: ErrorType) {
      this.value = new CellError(errorType)
    }
  }

  export type Type = Number | String | Boolean | Empty | Formula | MatrixFormula | Error
}

/**
 * Checks whether string looks like formula or not.
 *
 * @param text - formula
 */
export function isFormula(text: string): boolean {
  return text.startsWith('=')
}

export function isBoolean(text: string): boolean {
  const tl = text.toLowerCase()
  return tl === 'true' || tl === 'false'
}

export function isMatrix(text: RawCellContent): boolean {
  if (typeof text !== 'string') {
    return false
  }
  return (text.length > 1) && (text.startsWith('{')) && (text.endsWith('}'))
}

export function isError(text: string, errorMapping: Record<string, ErrorType>): boolean {
  const upperCased = text.toUpperCase()
  const errorRegex = /#[A-Za-z0-9\/]+[?!]?/
  return errorRegex.test(upperCased) && Object.prototype.hasOwnProperty.call(errorMapping, upperCased)
}

export class CellContentParser {
  constructor(
    private readonly config: Config,
    private readonly dateHelper: DateTimeHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper) {

  }

  private currencyMatcher(token: string): Maybe<[string, string]> {
    for(const currency of this.config.currencySymbol) {
      if(token.startsWith(currency)) {
        return [currency, token.slice(currency.length)]
      }
      if(token.endsWith(currency)) {
        return [currency, token.slice(0, token.length - currency.length)]
      }
    }
    return undefined
  }

  public parse(content: RawCellContent): CellContent.Type {
    if (content === undefined || content === null) {
      return CellContent.Empty.getSingletonInstance()
    } else if (typeof content === 'number') {
      if (isNumberOverflow(content)) {
        return new CellContent.Error(ErrorType.NUM)
      } else {
        return new CellContent.Number(content)
      }
    } else if (typeof content === 'boolean') {
      return new CellContent.Boolean(content)
    } else if (content instanceof Date) {
      return new CellContent.Number(new DateNumber(this.dateHelper.dateToNumber({
        day: content.getDate(),
        month: content.getMonth() + 1,
        year: content.getFullYear()
      }), 'Date()'))
    } else if (typeof content === 'string') {
      if (isBoolean(content)) {
        return new CellContent.Boolean(content.toLowerCase() === 'true')
      } else if (isMatrix(content)) {
        return new CellContent.MatrixFormula(content.substr(1, content.length - 2))
      } else if (isFormula(content)) {
        return new CellContent.Formula(content)
      } else if (isError(content, this.config.errorMapping)) {
        return new CellContent.Error(this.config.errorMapping[content.toUpperCase()])
      } else {
        let trimmedContent = content.trim()
        let mode = 0
        let currency
        if(trimmedContent.endsWith('%')) {
          mode = 1
          trimmedContent = trimmedContent.slice(0, trimmedContent.length-1)
        } else {
          const res = this.currencyMatcher(trimmedContent)
          if(res !== undefined) {
            mode = 2;
            [currency, trimmedContent] = res
          }
        }


        const val = this.numberLiteralsHelper.numericStringToMaybeNumber(trimmedContent)
        if(val !== undefined) {
          let parseAsNum
          if(mode === 1) {
            parseAsNum = new PercentNumber(val/100)
          } else if(mode === 2) {
            parseAsNum = new CurrencyNumber(val, currency as string)
          } else {
            parseAsNum = val
          }
          return new CellContent.Number(parseAsNum)
        }
        const parsedDateNumber = this.dateHelper.dateStringToDateNumber(trimmedContent)
        if (parsedDateNumber !== undefined) {
          return new CellContent.Number(parsedDateNumber)
        } else {
          return new CellContent.String(content.startsWith('\'') ? content.slice(1) : content )
        }
      }
    } else {
      throw new UnableToParseError(content)
    }
  }
}
