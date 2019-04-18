import {cellError, CellValue, ErrorType, isCellError} from '../Cell'

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
export function add(left: CellValue, right: CellValue): CellValue {
  if (isCellError(left)) {
    return left
  }
  if (isCellError(right)) {
    return right
  }
  if (typeof left === 'number') {
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
  if (isCellError(left)) {
    return left
  }
  if (isCellError(right)) {
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


/**
 * Adds two numbers
 *
 * Implementation of adding which is used in interpreter.
 *
 * Errors are propagated, non-numerical values cause it to return VALUE error.
 *
 * @param left - left operand of addition
 * @param right - right operand of addition
 */
export function addStrict(left: CellValue, right: CellValue): CellValue {
  if (isCellError(left)) {
    return left
  }
  if (isCellError(right)) {
    return right
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left + right
  } else {
    return cellError(ErrorType.VALUE)
  }
}
