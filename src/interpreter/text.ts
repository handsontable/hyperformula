import {CellError, EmptyValue, ErrorType, InternalCellValue} from '../Cell'
import {InterpreterValue, SimpleRangeValue} from './InterpreterValue'

/**
 * Concatenates two strings
 *
 * Implementation of concatenating strings which is used in interpreter.
 *
 * Errors are propagated.
 *
 * @param args - list of cell values to concatenate
 */
export function concatenate(args: InterpreterValue[]): InternalCellValue {
  return args.reduce((acc: InternalCellValue, arg: InterpreterValue) => {
    if (acc instanceof CellError) {
      return acc
    } else if (arg instanceof CellError) {
      return arg
    } else if (arg === EmptyValue) {
      return acc
    } else if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else {
      return (acc as string).concat(arg.toString())
    }
  }, '')
}
