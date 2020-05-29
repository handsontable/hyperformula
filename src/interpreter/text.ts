/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, EmptyValue, ErrorType, InternalScalarValue} from '../Cell'
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
export function concatenate(args: InterpreterValue[]): InternalScalarValue {
  return args.reduce((acc: InternalScalarValue, arg: InterpreterValue) => {
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
