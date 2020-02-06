import {CellError, CellValue, CellValueTypeOrd, EmptyValue, EmptyValueType, ErrorType, getCellValueType} from '../Cell'
import {Config} from '../Config'
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

export function add(left: number | CellError, right: number | CellError, eps: number): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    const ret = left + right
    if (Math.abs(ret) < eps * Math.abs(left)  ) {
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
export function subtract(left: number | CellError, right: number | CellError, eps: number): number | CellError {
  if (left instanceof CellError) {
    return left
  } else if (right instanceof CellError) {
    return right
  } else {
    const ret = left - right
    if ( Math.abs(ret) < eps * Math.abs(left)  ) {
      return 0
    } else {
      return ret
    }
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

export function greater(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left > right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left > right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left > mod * right
  } else {
    const mod = (1 + eps)
    return left * mod > right
  }
}

export function less(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left < right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left < right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left * mod < right
  } else {
    const mod = (1 + eps)
    return left < mod * right
  }
}

export function lesseq(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left <= right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left <= right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left <= mod * right
  } else {
    const mod = (1 + eps)
    return left * mod <= right
  }
}

export function greatereq(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left >= right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left >= right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left * mod >= right
  } else {
    const mod = (1 + eps)
    return left >= mod * right
  }
}

export function equality(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left === right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left === right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left * mod >= right && left <= right * mod
  } else {
    const mod = (1 + eps)
    return left * mod <= right && left >= right * mod
  }
}

export function nonequality(left: number | string | boolean, right: number | string | boolean, eps: number): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return left !== right
  } else if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left !== right
  } else if (right >= 0) {
    const mod = (1 + eps)
    return left * mod < right || left > right * mod
  } else {
    const mod = (1 + eps)
    return left * mod > right || left < right * mod
  }
}

