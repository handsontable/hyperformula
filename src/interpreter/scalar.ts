import {CellValue, isCellError} from "../Cell";

export function add(left: CellValue, right: CellValue): CellValue {
  if (isCellError(left)) {
    return left
  }
  if (isCellError(right)) {
    return right
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left + right
  }

  return left
}