import {CellValue} from '../Cell'
import {Config} from '../Config'
import {numberToDate} from '../Date'
import {
  FormatExpression,
  FormatExpressionType,
  FormatToken,
  parse,
  parseForDateFormat,
  parseForNumberFormat,
  TokenType
} from './parser'

export function format(value: number, formatArg: string, config: Config): CellValue {
  const tryString = config.stringifyDate(value, formatArg, config) //default points to stringifyDate()
  if(tryString != null) {
    return tryString
  } else {
    const expression = parseForNumberFormat(formatArg)

    if(expression !== null) {
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

function numberFormat(tokens: FormatToken[], value: number): CellValue {
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

export function stringifyDate(value: number, formatArg: string, config: Config): string | null {
  const expression = parseForDateFormat(formatArg)
  if(expression === null) {
    return null
  }
  const tokens = expression.tokens
  let result = ''
  const date = numberToDate(value, config)
//  let minutes: boolean = false

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]
    if (token.type === TokenType.FREE_TEXT) {
      result += token.value
      continue
    }

    switch (token.value) {
        /* hours*/
//      case 'h':
//      case 'H':
//      case 'hh':
//      case 'HH': {
//        minutes = true
//        result += date.format(token.value)
//        break
//      }

        /* days */
      case 'd':
      case 'D':
      case 'dd':
      case 'DD': {
        result += padLeft(date.day, token.value.length)
        break
      }
//      case 'ddd':
//      case 'DDD':
//        result += date.format('ddd')
//        break
//      case 'dddd':
//      case 'DDDD': {
//        result += date.format('dddd')
//        break
//      }

        /* minutes / months */
      case 'M':
      case 'm':
      case 'MM':
      case 'mm': {
//        if (minutes) {
//          result += padLeft(date.minute(), token.value.length)
//          break
//        } else {
          result += padLeft(date.month, token.value.length)
          break
//        }
      }
      // case 'mmm':
      // case 'MMM': {
      //   result += date.format('MMM')
      //   break
      // }
      // case 'mmmm':
      // case 'MMMM': {
      //   result += date.format('MMMM')
      //   break
      // }
      // case 'mmmmm':
      // case 'MMMMM': {
      //   result += date.format('MMMM')[0]
      //   break
      // }

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

      // /* AM / PM */
      // case 'AM/PM': {
      //  result += date.format('A')
      //  break
      // }
      default:
        throw new Error('Mismatched token type')
    }
  }

  return result
}
