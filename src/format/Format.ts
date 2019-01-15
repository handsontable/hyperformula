import {cellError, CellValue, ErrorType} from '../Cell'
import {dateNumberToMoment} from '../Date'
import {FormatExpression, FormatExpressionType, FormatToken, TokenType} from './FormatParser'

export function format(expression: FormatExpression, value: number): CellValue {
  if (expression.type === FormatExpressionType.DATE) {
    return dateFormatInterpreter(expression.tokens, value)
  } else if (expression.type === FormatExpressionType.NUMBER) {
    throw new Error('Number formatting not supported yet')
  } else if (expression.type === FormatExpressionType.STRING) {
    return expression.tokens[0].value
  }

  return ''
}

export function pad(number: number, size: number) {
  let result = number + ''
  while (result.length < size) {
    result = '0' + result
  }
  return result
}

function dateFormatInterpreter(tokens: FormatToken[], value: number): CellValue {
  let result = ''
  const date = dateNumberToMoment(value)
  let minutes: boolean = false

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]
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
        result += date.format(token.value)
        break
      }

        /* days */
      case 'd':
      case 'D':
      case 'dd':
      case 'DD': {
        result += pad(date.date(), token.value.length)
        break
      }
      case 'ddd':
      case 'DDD':
        result += date.format('ddd')
        break
      case 'dddd':
      case 'DDDD': {
        result += date.format('dddd')
        break
      }

        /* minutes / months */
      case 'M':
      case 'm':
      case 'MM':
      case 'mm': {
        if (minutes) {
          result += pad(date.minute(), token.value.length)
          break
        } else {
          result += pad(date.month() + 1, token.value.length)
          break
        }
      }
      case 'mmm':
      case 'MMM': {
        result += date.format('MMM')
        break
      }
      case 'mmmm':
      case 'MMMM': {
        result += date.format('MMMM')
        break
      }
      case 'mmmmm':
      case 'MMMMM': {
        result += date.format('MMMM')[0]
        break
      }

        /* years */
      case 'yy':
      case 'YY': {
        result += date.format('YY')
        break
      }
      case 'yyyy':
      case 'YYYY': {
        result += date.year()
        break
      }
      default:
        throw new Error('Mismatched token type')
    }
  }

  return result
}
