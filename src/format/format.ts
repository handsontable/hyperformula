/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalCellValue} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper, SimpleDateTime} from '../DateTimeHelper'
import {Maybe} from '../Maybe'
import {FormatToken, parseForDateTimeFormat, parseForNumberFormat, TokenType} from './parser'

export function format(value: number, formatArg: string, config: Config, dateHelper: DateTimeHelper): InternalCellValue {
  const tryString = config.stringifyDateTime(dateHelper.numberToDateTime(value), formatArg) // default points to defaultStringifyDateTime()
  if (tryString !== undefined) {
    return tryString
  } else {
    const expression = parseForNumberFormat(formatArg)

    if (expression !== undefined) {
      return numberFormat(expression.tokens, value)
    } else {
      return formatArg
    }
  }
}

export function padLeft(number: number | string, size: number) {
  let result = number + ''
  while (result.length < size) {
    result = '0' + result
  }
  return result
}

export function padRight(number: number | string, size: number) {
  let result = number + ''
  while (result.length < size) {
    result = result + '0'
  }
  return result
}

function countChars(text: string, char: string) {
  return text.split(char).length - 1
}

function numberFormat(tokens: FormatToken[], value: number): InternalCellValue {
  let result = ''

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    const tokenParts = token.value.split('.')
    const integerFormat = tokenParts[0]
    const decimalFormat = tokenParts[1] || ''
    const separator = tokenParts[1] ? '.' : ''

    /* get fixed-point number without trailing zeros */
    const valueParts = Number(value.toFixed(decimalFormat.length)).toString().split('.')
    let integerPart = valueParts[0] || ''
    let decimalPart = valueParts[1] || ''

    if (integerFormat.length > integerPart.length) {
      const padSize = countChars(integerFormat.substr(0, integerFormat.length - integerPart.length), '0')
      integerPart = padLeft(integerPart, padSize + integerPart.length)
    }

    const padSize = countChars(decimalFormat.substr(decimalPart.length, decimalFormat.length - decimalPart.length), '0')
    decimalPart = padRight(decimalPart, padSize + decimalPart.length)

    result += integerPart + separator + decimalPart
  }

  return result
}

export function defaultStringifyDateTime(date: SimpleDateTime, formatArg: string): Maybe<string> {
  const expression = parseForDateTimeFormat(formatArg)
  if (expression === undefined) {
    return undefined
  }
  const tokens = expression.tokens
  let result = ''
  let minutes: boolean = false

  const ampm = tokens.some( (token) => token.type === TokenType.FORMAT && (token.value === 'a' || token.value === 'A') )

  for (const token of tokens){
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    switch (token.value) {
      /* hours*/
      case 'h':
      case 'H':
      case 'hh':
      case 'HH': {
        minutes = true
        result += padLeft( ampm? (date.hour+11)%12+1 : date.hour, token.value.length)
        break
      }

      /* days */
      case 'd':
      case 'D':
      case 'dd':
      case 'DD': {
        result += padLeft(date.day, token.value.length)
        break
      }

      /* seconds */
      case 's':
      case 'ss': {
        result += padLeft(date.second, token.value.length)
        break
      }

      /* minutes / months */
      case 'M':
      case 'm':
      case 'MM':
      case 'mm': {
        if (minutes) {
          result += padLeft(date.minute, token.value.length)
        } else {
          result += padLeft(date.month, token.value.length)
        }
        break
      }

      /* years */
      case 'yy':
      case 'YY': {
        result += padLeft(date.year % 100, token.value.length)
        break
      }
      case 'yyyy':
      case 'YYYY': {
        result += date.year
        break
      }

      /* AM / PM */
      case 'a':
      case 'A': {
       result += date.hour < 12 ? 'am' : 'pm'
       break
      }
      default:
        throw new Error('Mismatched token type')
    }
  }

  return result
}

