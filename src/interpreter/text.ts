import {CellValue, isCellError} from '../Cell'

/**
 * Concatenates two strings
 *
 * Implementation of concatenating strings which is used in interpreter.
 *
 * Errors are propagated.
 *
 * @param args - list of cell values to concatenate
 */
export function concatenate(args: CellValue[]): CellValue {
  return args.reduce((acc: CellValue, arg: CellValue) => {
    if (isCellError(acc)) {
      return acc
    } else if (isCellError(arg)) {
      return arg
    } else {
      return (acc as string).concat(arg.toString())
    }
  }, '')
}
