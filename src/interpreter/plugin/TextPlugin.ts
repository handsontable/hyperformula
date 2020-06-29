/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToString} from '../ArithmeticHelper'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CONCATENATE': {
      method: 'concatenate',
    },
    'SPLIT': {
      method: 'split',
    },
    'LEN': {
      method: 'len'
    },
    'TRIM': {
      method: 'trim'
    },
    'PROPER': {
      method: 'proper'
    },
    'CLEAN': {
      method: 'clean'
    },
    'REPT': {
      method: 'rept'
    },
    'RIGHT': {
      method: 'right'
    },
    'LEFT': {
      method: 'left'
    }
  }

  /**
   * Corresponds to CONCATENATE(value1, [value2, ...])
   *
   * Concatenates provided arguments to one string.
   *
   * @param args
   * @param formulaAddress
   */
  public concatenate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length == 0) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    let result = ''
    for (const value of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      const coercedValue = coerceScalarToString(value)
      if (coercedValue instanceof CellError) {
        return value
      } else {
        result = result.concat(coercedValue)
      }
    }
    return result
  }

  /**
   * Corresponds to SPLIT(string, index)
   *
   * Splits provided string using space separator and returns chunk at zero-based position specified by second argument
   *
   * @param ast
   * @param formulaAddress
   */
  public split(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const stringArg = ast.args[0]
    const indexArg = ast.args[1]

    const stringToSplit = this.evaluateAst(stringArg, formulaAddress)
    if (typeof stringToSplit !== 'string') {
      return new CellError(ErrorType.VALUE)
    }
    const indexToUse = this.evaluateAst(indexArg, formulaAddress)
    if (typeof indexToUse !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    const splittedString = stringToSplit.split(' ')

    if (indexToUse > splittedString.length || indexToUse < 0) {
      return new CellError(ErrorType.VALUE)
    }

    return splittedString[indexToUse]
  }

  public len(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToStringArgument(ast, formulaAddress, (arg: string) => {
      return arg.length
    })
  }

  public trim(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToStringArgument(ast, formulaAddress, (arg: string) => {
      return arg.replace(/^ +| +$/g, '').replace(/ +/g, ' ')
    })
  }

  public proper(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToStringArgument(ast, formulaAddress, (arg: string) => {
      return arg.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    })
  }

  public clean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToStringArgument(ast, formulaAddress, (arg: string) => {
      // eslint-disable-next-line no-control-regex
      return arg.replace(/[\u0000-\u001F]/g, '')
    })
  }

  public rept(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.coerceArguments(ast, formulaAddress, [
      coerceScalarToString,
      this.coerceScalarToNumberOrError
    ], (text: string, count: number) => {
      if (count < 0) {
        return new CellError(ErrorType.VALUE)
      }
      return text.repeat(count)
    })
  }

  public right(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.coerceArgumentsWithDefaults(ast.args, formulaAddress, [
      coerceScalarToString,
      this.coerceScalarToNumberOrError
    ], [
      undefined,
      1
    ], (text: string, lenght: number) => {
      if (lenght < 0) {
        return new CellError(ErrorType.VALUE)
      } else if (lenght === 0) {
        return ''
      }
      return text.slice(-lenght)
    })
  }

  public left(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.coerceArgumentsWithDefaults(ast.args, formulaAddress, [
      coerceScalarToString,
      this.coerceScalarToNumberOrError
    ], [
      undefined,
      1
    ], (text: string, lenght: number) => {
      if (lenght < 0) {
        return new CellError(ErrorType.VALUE)
      }
      return text.slice(0, lenght)
    })
  }
}
