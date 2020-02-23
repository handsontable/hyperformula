import {CellError, ErrorType, InternalCellValue} from '../Cell'
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
export function nonstrictadd(left: InternalCellValue, right: InternalCellValue): number | CellError {
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

export function strCmp(left: string, right: string): number {
  if (left > right) {
    return 1
  } else if (left < right) {
    return -1
  } else {
    return 0
  }
}

export function floatCmp(left: number, right: number, eps: number): number {
  const mod = (1 + eps)
  if ( (right >= 0) && (left * mod >= right) && (left <= right * mod) ) {
    return 0
  } else if ( (right <= 0) && (left * mod <= right) && (left >= right * mod) ) {
    return 0
  } else if ( left > right ) {
    return 1
  } else {
    return -1
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
  return (isNaN(arg) || arg===Infinity || arg===-Infinity)
}

export function fixNegativeZero(arg: number): number {
  if(arg===0) {
    return 0
  } else {
    return arg
  }
}
