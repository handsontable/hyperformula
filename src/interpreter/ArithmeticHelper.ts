import {CellError, EmptyValue, ErrorType, InternalCellValue, NoErrorCellValue} from '../Cell'
import {Config} from '../Config'
import {DateHelper} from '../DateHelper'
import {Maybe} from '../Maybe'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'

export class ArithmeticHelper {
  constructor(
    private readonly config: Config,
    private readonly dateHelper: DateHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper,
  ) {

  }
  public coerceScalarToNumberOrError(arg: InternalCellValue): number | CellError {
    if (arg instanceof CellError) {
      return arg
    }
    return this.coerceToMaybeNumber(arg) ?? new CellError(ErrorType.VALUE)
  }

  public coerceToMaybeNumber(arg: NoErrorCellValue): Maybe<number> {
    return this.coerceNonDateScalarToMaybeNumber(arg) ?? (
      typeof arg === 'string' ? this.dateHelper.dateStringToDateNumber(arg) : undefined
    )
  }

  public coerceNonDateScalarToMaybeNumber(arg: NoErrorCellValue): Maybe<number> {
    if (arg === EmptyValue) {
      return 0
    }
    if (typeof arg === 'string' && this.numberLiteralsHelper.isNumber(arg)) {
      return this.numberLiteralsHelper.numericStringToNumber(arg)
    } else {
      const coercedNumber = Number(arg)
      if (isNaN(coercedNumber)) {
        return undefined
      } else {
        return coercedNumber
      }
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
  if (typeof arg === 'string') {
    return ''
  } else if (typeof arg === 'number') {
    return 0
  } else if (typeof arg === 'boolean') {
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
