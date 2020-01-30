import {CellError, CellValue, EmptyValue, ErrorType} from '../Cell'
import {Config} from '../Config'
import {dateStringToDateNumber} from '../Date'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'

/**
 * Coerce scalar value to number if possible
 * Date like literals will be converted to number representation (days after 12th Dec 1899)
 *
 * @param arg - cell value
 * @param config
 */
export function coerceScalarToNumber(arg: CellValue, config: Config): number | CellError {
  let ret = coerceNonDateScalarToMaybeNumber(arg)
  if (ret != null) {
    return ret
  }
  if (typeof arg === 'string') {
    const parsedDateNumber = dateStringToDateNumber(arg, config)
    if (parsedDateNumber !== null) {
      return parsedDateNumber
    }
  }
  return new CellError(ErrorType.VALUE)
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
