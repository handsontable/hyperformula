import {cellError, CellValue, ErrorType, isCellError} from '../Cell'

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
