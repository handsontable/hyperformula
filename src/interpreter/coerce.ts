import {CellError, CellValue, EmptyValue, ErrorType} from '../Cell'
import {stringToDateNumber} from '../Date'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'

/**
 * Converts cell value to date number representation (days after 12th Dec 1899)
 *
 * If value is a number simply returns value
 * If value is a string, it tries to parse it with date format
 *
 *
 * @param arg - cell value
 * @param dateFormat - date format pattern used when argument is a text
 */
export function coerceDateToNumber(arg: CellValue, dateFormat: string): number | CellError {
  if (typeof arg === 'string') {
    const parsedDateNumber = stringToDateNumber(arg, dateFormat)
    if (parsedDateNumber !== null) {
      return parsedDateNumber
    }
  }
  return coerceNonDateScalarToNumber(arg)
}

export function isDate(arg: CellValue, dateFormat: string): boolean {
  if (typeof arg === 'string') {
    const parsedDateNumber = stringToDateNumber(arg, dateFormat)
    if (parsedDateNumber !== null) {
      return true
    }
  }
  return false
}

export function coerceScalarToNumber(arg: CellValue, dateFormat: string): number | CellError {
  let ret = coerceNonDateScalarToMaybeNumber(arg)
  if(ret == null) {
    if (typeof arg === 'string') {
      const parsedDateNumber = stringToDateNumber(arg, dateFormat)
      if (parsedDateNumber !== null) {
        return parsedDateNumber
      }
    }
    return new CellError(ErrorType.VALUE)
  }
  return ret
}

export function coerceToRange(arg: InterpreterValue): SimpleRangeValue {
  if (arg instanceof SimpleRangeValue) {
    return arg
  } else {
    return SimpleRangeValue.fromScalar(arg)
  }
}

export function coerceToRangeNumbersOrError(arg: InterpreterValue): SimpleRangeValue | CellError | null {
  if ((arg instanceof SimpleRangeValue && arg.hasOnlyNumbers()) || arg instanceof CellError) {
    return arg
  } else if (typeof arg === 'number') {
    return SimpleRangeValue.fromScalar(arg)
  } else {
    return null
  }
}

export function coerceBooleanToNumber(arg: boolean): number {
  return Number(arg)
}

export function coerceNonDateScalarToNumber(arg: CellValue): number | CellError {
  if (arg === EmptyValue) {
    return 0
  }
  if (arg instanceof CellError) {
    return arg
  }
  const coercedNumber = Number(arg)
  if (isNaN(coercedNumber)) {
    return new CellError(ErrorType.VALUE)
  } else {
    return coercedNumber
  }
}

export function coerceNonDateScalarToMaybeNumber(arg: CellValue): number | CellError | null {
  if (arg === EmptyValue) {
    return 0
  }
  if (arg instanceof CellError) {
    return arg
  }
  const coercedNumber = Number(arg)
  if (isNaN(coercedNumber)) {
    return null
  } else {
    return coercedNumber
  }
}

/**
 * Coerce scalar value to boolean if possible, or error if value is an error
 *
 * @param arg
 */
export function coerceScalarToBoolean(arg: CellValue): boolean | CellError | null {
  if (arg instanceof CellError || typeof arg === 'boolean') {
    return arg
  } else if (arg === EmptyValue) {
    return false
  } else if (typeof arg === 'number') {
    return arg !== 0
  } else {
    const argUppered = arg.toUpperCase()
    if (argUppered === 'TRUE') {
      return true
    } else if (argUppered === 'FALSE') {
      return false
    } else {
      return null
    }
  }
}

export function coerceScalarToString(arg: CellValue): string | CellError {
  if (arg instanceof CellError || typeof arg === 'string') {
    return arg
  } else if (arg === EmptyValue) {
    return ''
  } else if (typeof arg === 'number') {
    return arg.toString()
  } else {
    return arg ? 'TRUE' : 'FALSE'
  }
}
