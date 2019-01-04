/**
 * Converts cell value to date number representation (days after 12th Dec 1899)
 *
 * If value is a number simply returns value
 * If value is a string, it tries to parse it with known format
 *
 * @param arg
 */
import {cellError, CellValue, ErrorType} from "../Cell";
import {stringToDateNumber} from "../Date";

export function dateNumberRepresentation(arg: CellValue, dateFormat: string): number | null {
  if (typeof arg === 'number') {
    return arg
  } else if (typeof arg === 'string') {
    return stringToDateNumber(arg, dateFormat)
  } else {
    return null
  }
}

/**
 * Converts cell value to boolean representation
 *
 * if value is a boolean simply returns value
 * if value is a number return true if value is different than 0
 *
 * @param arg
 */
export function booleanRepresentation(arg: CellValue): CellValue {
  if (typeof arg === 'number') {
    return arg !== 0
  } else if (typeof arg === 'boolean') {
    return arg
  } else {
    return cellError(ErrorType.VALUE)
  }
}