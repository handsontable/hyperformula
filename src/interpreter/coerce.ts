import {CellError, EmptyValue, ErrorType, InternalCellValue, NoErrorCellValue} from '../Cell'
import {DateTimeHelper} from '../DateTimeHelper'
import {Maybe} from '../Maybe'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
import {NumberLiteralHelper} from '../NumberLiteralHelper'

/**
 * Coerce scalar value to number if possible
 * Date like literals will be converted to number representation (days after 12th Dec 1899)
 *
 * @param arg - cell value
 * @param dateHelper
 * @param numberLiteralsHelper
 */
export function coerceScalarToNumberOrError(arg: InternalCellValue, dateHelper: DateTimeHelper, numberLiteralsHelper: NumberLiteralHelper): number | CellError {
  if (arg instanceof CellError) {
    return arg
  }
  return coerceToMaybeNumber(arg, dateHelper, numberLiteralsHelper) ?? new CellError(ErrorType.VALUE)
}

export function coerceToMaybeNumber(arg: NoErrorCellValue, dateHelper: DateTimeHelper, numberLiteralsHelper: NumberLiteralHelper): Maybe<number> {
  return coerceNonDateScalarToMaybeNumber(arg, numberLiteralsHelper) ?? (
      typeof arg === 'string' ? dateHelper.dateStringToDateNumber(arg) : undefined
    )
}

export function coerceNonDateScalarToMaybeNumber(arg: NoErrorCellValue, numberLiteralsHelper: NumberLiteralHelper): Maybe<number> {
  if (arg === EmptyValue) {
    return 0
  }
  if (typeof arg === 'string' && numberLiteralsHelper.isNumber(arg)) {
    return numberLiteralsHelper.numericStringToNumber(arg)
  } else {
    const coercedNumber = Number(arg)
    if (isNaN(coercedNumber)) {
      return undefined
    } else {
      return coercedNumber
    }
  }
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

export function coerceEmptyToValue(arg: NoErrorCellValue): NoErrorCellValue {
  if(typeof arg === 'string') {
    return ''
  } else if(typeof arg === 'number') {
    return 0
  } else if(typeof arg === 'boolean') {
    return false
  } else {
    return EmptyValue
  }
}

/**
 * Coerce scalar value to boolean if possible, or error if value is an error
 *
 * @param arg
 */
export function coerceScalarToBoolean(arg: InternalCellValue): boolean | CellError | null {
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

export function coerceScalarToString(arg: InternalCellValue): string | CellError {
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
