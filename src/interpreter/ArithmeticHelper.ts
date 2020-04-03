import {
  CellError,
  CellValueTypeOrd,
  EmptyValue,
  ErrorType,
  getCellValueType,
  InternalCellValue,
  NoErrorCellValue
} from '../Cell'
import {Config} from '../Config'
import {DateHelper} from '../DateHelper'
import {Maybe} from '../Maybe'
import {NumberLiteralHelper} from '../NumberLiteralHelper'
import {collatorFromConfig} from '../StringHelper'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'
import {floatCmp, numberCmp} from './scalar'
import Collator = Intl.Collator

export class ArithmeticHelper {
  private readonly collator: Collator
  private readonly actualEps: number
  constructor(
    private readonly config: Config,
    private readonly dateHelper: DateHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper,
  ) {
    this.collator = collatorFromConfig(config)
    this.actualEps = config.smartRounding ? config.precisionEpsilon : 0
  }

  public compare(left: NoErrorCellValue, right: NoErrorCellValue): number {
    if (typeof left === 'string' || typeof right === 'string') {
      const leftTmp = typeof left === 'string' ? this.dateHelper.dateStringToDateNumber(left) : left
      const rightTmp = typeof right === 'string' ? this.dateHelper.dateStringToDateNumber(right) : right
      if (typeof leftTmp === 'number' && typeof rightTmp === 'number') {
        return floatCmp(leftTmp, rightTmp, this.actualEps)
      }
    }

    if(left === EmptyValue) {
      left = coerceEmptyToValue(right)
    } else if(right === EmptyValue) {
      right = coerceEmptyToValue(left)
    }

    if ( typeof left === 'string' && typeof right === 'string') {
      return this.collator.compare(left, right)
    } else if ( typeof left === 'boolean' && typeof right === 'boolean' ) {
      return numberCmp(coerceBooleanToNumber(left), coerceBooleanToNumber(right))
    } else if ( typeof left === 'number' && typeof right === 'number' ) {
      return floatCmp(left, right, this.config.smartRounding ? this.config.precisionEpsilon : 0)
    } else if ( left === EmptyValue && right === EmptyValue ) {
      return 0
    } else {
      return numberCmp(CellValueTypeOrd(getCellValueType(left)), CellValueTypeOrd(getCellValueType(right)))
    }
  }

  public add(left: number | CellError, right: number | CellError): number | CellError {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else {
      const ret = left + right
      if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
        return 0
      } else {
        return ret
      }
    }
  }

  /**
   * Subtracts two numbers
   *
   * Implementation of subtracting which is used in interpreter.
   *
   * Errors are propagated.
   *
   * @param left - left operand of subtraction
   * @param right - right operand of subtraction
   * @param eps - precision of comparison
   */
  public subtract(left: number | CellError, right: number | CellError): number | CellError {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else {
      const ret = left - right
      if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
        return 0
      } else {
        return ret
      }
    }
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
