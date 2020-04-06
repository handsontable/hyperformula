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
        return this.floatCmp(leftTmp, rightTmp)
      }
    }

    if(left === EmptyValue) {
      left = coerceEmptyToValue(right)
    } else if(right === EmptyValue) {
      right = coerceEmptyToValue(left)
    }

    if ( typeof left === 'string' && typeof right === 'string') {
      return this.stringCmp(left, right)
    } else if ( typeof left === 'boolean' && typeof right === 'boolean' ) {
      return numberCmp(coerceBooleanToNumber(left), coerceBooleanToNumber(right))
    } else if ( typeof left === 'number' && typeof right === 'number' ) {
      return this.floatCmp(left, right)
    } else if ( left === EmptyValue && right === EmptyValue ) {
      return 0
    } else {
      return numberCmp(CellValueTypeOrd(getCellValueType(left)), CellValueTypeOrd(getCellValueType(right)))
    }
  }

  public floatCmp(left: number, right: number): number {
    const mod = (1 + this.actualEps)
    if ((right >= 0) && (left * mod >= right) && (left <= right * mod)) {
      return 0
    } else if ((right <= 0) && (left * mod <= right) && (left >= right * mod)) {
      return 0
    } else if (left > right) {
      return 1
    } else {
      return -1
    }
  }

  public stringCmp(left: string, right: string): number {
    return this.collator.compare(left, right)
  }

  public add(left: number | CellError, right: number | CellError): number | CellError {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else {
      return this.addWithEpsilon(left, right)
    }
  }

  private addWithEpsilon(left: number, right: number): number {
    const ret = left + right
    if (Math.abs(ret) < this.actualEps * Math.abs(left)) {
      return 0
    } else {
      return ret
    }
  }

  /**
   * Adds two numbers
   *
   * Implementation of adding which is used in interpreter.
   *
   * Errors are propagated, non-numerical values are ignored.
   *
   * @param left - left operand of addition
   * @param right - right operand of addition
   */
  public nonstrictadd = (left: InternalCellValue, right: InternalCellValue): number | CellError => {
    if (left instanceof CellError) {
      return left
    } else if (right instanceof CellError) {
      return right
    } else if (typeof left === 'number') {
      if (typeof right === 'number') {
        return this.addWithEpsilon(left, right)
      } else {
        return left
      }
    } else if (typeof right === 'number') {
      return right
    } else {
      return 0
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

/**
 * Multiplies two numbers
 *
 * Implementation of multiplication which is used in interpreter.
 *
 * Errors are propagated.
 *
 * @param left - left operand of multiplication
 * @param right - right operand of multiplication
 */
export function multiply(left: number | CellError, right: number | CellError): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    return left * right
  }
}

export function power(left: number | CellError, right: number | CellError): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    return Math.pow(left, right)
  }
}

export function divide(left: number | CellError, right: number | CellError): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else if (right === 0) {
    return new CellError(ErrorType.DIV_BY_ZERO)
  } else {
    return (left / right)
  }
}

export function unaryminus(value: number | CellError): number | CellError {
  if (value instanceof CellError) {
    return value
  } else {
    return -value
  }
}

export function percent(value: number | CellError): number | CellError {
  if (value instanceof CellError) {
    return value
  } else {
    return value / 100
  }
}

/**
 * Returns max from two numbers
 *
 * Implementation of max function which is used in interpreter.
 *
 * Errors are propagated, non-numerical values are neutral.
 *
 * @param left - left operand of addition
 * @param right - right operand of addition
 */
export function max(left: InternalCellValue, right: InternalCellValue): InternalCellValue {
  if (left instanceof CellError) {
    return left
  }
  if (right instanceof CellError) {
    return right
  }
  if (typeof left === 'number') {
    if (typeof right === 'number') {
      return Math.max(left, right)
    } else {
      return left
    }
  } else if (typeof right === 'number') {
    return right
  } else {
    return Number.NEGATIVE_INFINITY
  }
}

export function maxa(left: InternalCellValue, right: InternalCellValue): InternalCellValue {
  if (left instanceof CellError) {
    return left
  }
  if (right instanceof CellError) {
    return right
  }
  if (typeof left === 'boolean') {
    left = coerceBooleanToNumber(left)
  }
  if (typeof right === 'boolean') {
    right = coerceBooleanToNumber(right)
  }
  if (typeof left === 'number') {
    if (typeof right === 'number') {
      return Math.max(left, right)
    } else {
      return left
    }
  } else if (typeof right === 'number') {
    return right
  } else {
    return Number.NEGATIVE_INFINITY
  }
}

/**
 * Returns min from two numbers
 *
 * Implementation of min function which is used in interpreter.
 *
 * Errors are propagated, non-numerical values are neutral.
 *
 * @param left - left operand of addition
 * @param right - right operand of addition
 */
export function min(left: InternalCellValue, right: InternalCellValue): InternalCellValue {
  if (left instanceof CellError) {
    return left
  }
  if (right instanceof CellError) {
    return right
  }
  if (typeof left === 'number') {
    if (typeof right === 'number') {
      return Math.min(left, right)
    } else {
      return left
    }
  } else if (typeof right === 'number') {
    return right
  } else {
    return Number.POSITIVE_INFINITY
  }
}

export function mina(left: InternalCellValue, right: InternalCellValue): InternalCellValue {
  if (left instanceof CellError) {
    return left
  }
  if (right instanceof CellError) {
    return right
  }
  if (typeof left === 'boolean') {
    left = coerceBooleanToNumber(left)
  }
  if (typeof right === 'boolean') {
    right = coerceBooleanToNumber(right)
  }
  if (typeof left === 'number') {
    if (typeof right === 'number') {
      return Math.min(left, right)
    } else {
      return left
    }
  } else if (typeof right === 'number') {
    return right
  } else {
    return Number.POSITIVE_INFINITY
  }
}

export function numberCmp(left: number, right: number): number {
  if (left > right) {
    return 1
  } else if (left < right) {
    return -1
  } else {
    return 0
  }
}

export function isNumberOverflow(arg: number): boolean {
  return (isNaN(arg) || arg === Infinity || arg === -Infinity)
}

export function fixNegativeZero(arg: number): number {
  if (arg === 0) {
    return 0
  } else {
    return arg
  }
}
