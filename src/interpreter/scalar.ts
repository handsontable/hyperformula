import {CellError, CellValue, CellValueTypeOrd, EmptyValue, ErrorType, getCellValueType} from '../Cell'
import {stringToDateNumber} from '../Date'
import {coerceBooleanToNumber} from './coerce'

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
export function nonstrictadd(left: CellValue, right: CellValue): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else if (typeof left === 'number') {
    if (typeof right === 'number') {
      return left + right
    } else {
      return left
    }
  } else if (typeof right === 'number') {
    return right
  } else {
    return 0
  }
}

export function add(left: number | CellError, right: number | CellError): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    return left + right
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
 */
export function subtract(left: number | CellError, right: number | CellError): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    return left - right
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

export function unaryplus(value: number | CellError): number | CellError {
  return value
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
export function max(left: CellValue, right: CellValue): CellValue {
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

export function maxa(left: CellValue, right: CellValue): CellValue {
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
export function min(left: CellValue, right: CellValue): CellValue {
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

export function mina(left: CellValue, right: CellValue): CellValue {
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

export function greater(left: number, right: number, eps: number, ignoreEps: boolean): boolean {
  if(ignoreEps) {
    return left > right
  } else if (right >= 0) {
    return left > (1 + eps) * right
  } else {
    return left * (1 + eps) > right
  }
}

export function less(left: number, right: number, eps: number, ignoreEps: boolean): boolean {
  if (ignoreEps) {
    return left < right
  } else if (right >= 0) {
    return left * (1 + eps) < right
  } else {
    return left < (1 + eps) * right
  }
}

export function lesseq(left: number, right: number, eps: number, ignoreEps: boolean): boolean {
  if (ignoreEps) {
    return left <= right
  } else if (right >= 0) {
    return left <= (1 + eps) * right
  }
  else {
    return left * (1 + eps) <= right
  }
}

export function greatereq(left: number, right: number, eps: number, ignoreEps: boolean): boolean {
  if (ignoreEps) {
    return left >= right
  } else if (right >= 0) {
    return left * (1 + eps) >= right
  } else {
    return left >= (1 + eps) * right
  }
}

export function compare(left: CellValue, right: CellValue, dateFormat: string, comparator: (arg1: any, arg2: any) => boolean): boolean {
  if (typeof left === 'string' && typeof right === 'string') {
    const leftTmp = stringToDateNumber(left, dateFormat)
    const rightTmp = stringToDateNumber(right, dateFormat)
    if (leftTmp != null && rightTmp != null) {
      return comparator(leftTmp, rightTmp)
    }
  } else if (typeof left === 'string' && typeof right === 'number') {
    const leftTmp = stringToDateNumber(left, dateFormat)
    if (leftTmp != null) {
      return comparator(leftTmp, right)
    }
  } else if (typeof left === 'number' && typeof right === 'string') {
    const rightTmp = stringToDateNumber(right, dateFormat)
    if (rightTmp != null) {
      return comparator(left, rightTmp)
    }
  }

  if (typeof left !== typeof right) {
    return comparator(CellValueTypeOrd(getCellValueType(left)), CellValueTypeOrd(getCellValueType(right)))
  } else if (left === EmptyValue) {
    return false
  } else {
    return comparator(left, right)
  }
}
