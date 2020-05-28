/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalCellValue} from '../Cell'
import {Config} from '../Config'
import {DateTimeHelper, SimpleDateTime, SimpleTime} from '../DateTimeHelper'
import {Maybe} from '../Maybe'
import {FormatToken, parseForDateTimeFormat, parseForNumberFormat, TokenType} from './parser'

export function format(value: number, formatArg: string, config: Config, dateHelper: DateTimeHelper): InternalCellValue {
  const tryDateTime = config.stringifyDateTime(dateHelper.numberToDateTime(value), formatArg) // default points to defaultStringifyDateTime()
  if (tryDateTime !== undefined) {
    return tryDateTime
  }
  const tryDuration = config.stringifyDuration(dateHelper.numberToTime(value), formatArg)
  if(tryDuration !== undefined) {
    return tryDuration
  }
  const expression = parseForNumberFormat(formatArg)
  if (expression !== undefined) {
    return numberFormat(expression.tokens, value)
  }
  return formatArg
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

export function defaultStringifyDuration(time: SimpleTime, formatArg: string): Maybe<string> {
  const expression = parseForDateTimeFormat(formatArg)
  if (expression === undefined) {
    return undefined
  }
  const tokens = expression.tokens
  let result = ''

  for (const token of tokens) {
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    if(/^ss\.s+/.test(token.value) || /^ss\.0+/.test(token.value)) {
      const fractionOfSecondPrecision = token.value.length-3
      result += (time.second < 10 ? '0' : '') + Math.round(time.second * Math.pow(10, fractionOfSecondPrecision))/Math.pow(10, fractionOfSecondPrecision)
      continue
    }

    switch (token.value.toLowerCase()) {
      case 'h':
      case 'H':
      case 'hh':
      case 'HH': {
        result += padLeft( time.hour, token.value.length)
        time.hour = 0
        break
      }

      case '[hh]':
      case '[HH]': {
        result += padLeft( time.hour, token.value.length-2)
        time.hour = 0
        break
      }

      case 'M':
      case 'm':
      case 'MM':
      case 'mm': {
        result += padLeft(time.minute, token.value.length)
        time.minute = 0
        break
      }

      case '[mm]':
      case '[MM]': {
        result += padLeft(time.minute + 60*time.hour, token.value.length-2)
        time.minute = 0
        time.hour = 0
        break
      }

      /* seconds */
      case 's':
      case 'ss': {
        result += padLeft(time.second, token.value.length)
        break
      }

      default: {
        return undefined
      }
    }
  }
  return result
}

export function defaultStringifyDateTime(dateTime: SimpleDateTime, formatArg: string): Maybe<string> {
  const expression = parseForDateTimeFormat(formatArg)
  if (expression === undefined) {
    return undefined
  }
  const tokens = expression.tokens
  let result = ''
  let minutes: boolean = false

  const ampm = tokens.some( (token) => token.type === TokenType.FORMAT &&
    (token.value === 'a/p' || token.value === 'A/P' || token.value === 'am/pm' || token.value === 'AM/PM') )

  for (let i=0; i<tokens.length; i++){
    const token = tokens[i]
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    if(/^ss\.(s+|0+)/.test(token.value)) {
      const fractionOfSecondPrecision = token.value.length-3
      result += (dateTime.second < 10 ? '0' : '') + Math.round(dateTime.second * Math.pow(10, fractionOfSecondPrecision))/Math.pow(10, fractionOfSecondPrecision)
      continue
    }


    switch (token.value.toLowerCase()) {
      /* hours*/
      case 'h':
      case 'H':
      case 'hh':
      case 'HH': {
        minutes = true
        result += padLeft( ampm? (dateTime.hour+11)%12+1 : dateTime.hour, token.value.length)
        break
      }

      /* days */
      case 'd':
      case 'D':
      case 'dd':
      case 'DD': {
        result += padLeft(dateTime.day, token.value.length)
        break
      }

      /* seconds */
      case 's':
      case 'ss': {
        result += padLeft(Math.round(dateTime.second), token.value.length)
        break
      }

      /* minutes / months */
      case 'M':
      case 'm':
      case 'MM':
      case 'mm': {
        if(i+1 < tokens.length && tokens[i+1].value.startsWith(':')) {
          minutes = true
        }
        if (minutes) {
          result += padLeft(dateTime.minute, token.value.length)
        } else {
          result += padLeft(dateTime.month, token.value.length)
        }
        minutes = true
        break
      }

      /* years */
      case 'yy':
      case 'YY': {
        result += padLeft(dateTime.year % 100, token.value.length)
        break
      }
      case 'yyyy':
      case 'YYYY': {
        result += dateTime.year
        break
      }

      /* AM / PM */
      case 'am/pm':
      case 'a':
        {
        result += dateTime.hour < 12 ? 'am' : 'pm'
        break
      }
      case 'a/p':
      case 'A/P':
      case 'AM/PM':
       const [am, pm] = token.value.split('/')
       result += dateTime.hour < 12 ? am : pm
       break
      }
      default: {
        return undefined
      }
    }
  }

  return result
}
