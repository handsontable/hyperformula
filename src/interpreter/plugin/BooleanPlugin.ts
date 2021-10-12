/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalNoErrorScalarValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin implements FunctionPluginTypecheck<BooleanPlugin> {
  public static implementedFunctions = {
    'TRUE': {
      method: 'literalTrue',
      parameters: [],
    },
    'FALSE': {
      method: 'literalFalse',
      parameters: [],
    },
    'IF': {
      method: 'conditionalIf',
      parameters: [
        {argumentType: ArgumentTypes.BOOLEAN},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
        {argumentType: ArgumentTypes.SCALAR, defaultValue: false, passSubtype: true},
      ],
    },
    'AND': {
      method: 'and',
      parameters: [
        {argumentType: ArgumentTypes.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'OR': {
      method: 'or',
      parameters: [
        {argumentType: ArgumentTypes.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'XOR': {
      method: 'xor',
      parameters: [
        {argumentType: ArgumentTypes.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'NOT': {
      method: 'not',
      parameters: [
        {argumentType: ArgumentTypes.BOOLEAN},
      ]
    },
    'SWITCH': {
      method: 'switch',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
      ],
      repeatLastArgs: 1,
    },
    'IFERROR': {
      method: 'iferror',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
      ]
    },
    'IFNA': {
      method: 'ifna',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
      ]
    },
    'CHOOSE': {
      method: 'choose',
      parameters: [
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.SCALAR, passSubtype: true},
      ],
      repeatLastArgs: 1,
    },
  }

  /**
   * Corresponds to TRUE()
   *
   * Returns the logical true
   *
   * @param ast
   * @param state
   */
  public literalTrue(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TRUE'), () => true)
  }

  /**
   * Corresponds to FALSE()
   *
   * Returns the logical false
   *
   * @param ast
   * @param state
   */
  public literalFalse(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FALSE'), () => false)
  }

  /**
   * Corresponds to IF(expression, value_if_true, value_if_false)
   *
   * Returns value specified as second argument if expression is true and third argument if expression is false
   *
   * @param ast
   * @param state
   */
  public conditionalIf(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IF'), (condition, arg2, arg3) => {
      return condition ? arg2 : arg3
    })
  }

  /**
   * Corresponds to AND(expression1, [expression2, ...])
   *
   * Returns true if all of the provided arguments are logically true, and false if any of it is logically false
   *
   * @param ast
   * @param state
   */
  public and(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('AND'),
      (...args) => !args.some((arg: boolean) => !arg)
    )
  }

  /**
   * Corresponds to OR(expression1, [expression2, ...])
   *
   * Returns true if any of the provided arguments are logically true, and false otherwise
   *
   * @param ast
   * @param state
   */
  public or(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('OR'),
      (...args) => args.some((arg: boolean) => arg)
    )
  }

  public not(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NOT'), (arg) => !arg)
  }

  public xor(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XOR'), (...args) => {
      let cnt = 0
      args.forEach((arg: boolean) => {
        if (arg) {
          cnt++
        }
      })
      return (cnt % 2) === 1
    })
  }

  public switch(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SWITCH'), (selector, ...args) => {
      const n = args.length
      let i = 0
      for (; i + 1 < n; i += 2) {
        if (args[i] instanceof CellError) {
          continue
        }
        if (this.arithmeticHelper.eq(selector, args[i] as InternalNoErrorScalarValue)) {
          return args[i + 1]
        }
      }
      if (i < n) {
        return args[i]
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.NoDefault)
      }
    })
  }

  public iferror(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IFERROR'), (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if (arg1 instanceof CellError) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public ifna(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IFNA'), (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if (arg1 instanceof CellError && arg1.type === ErrorType.NA) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public choose(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHOOSE'), (selector, ...args) => {
      if (selector > args.length) {
        return new CellError(ErrorType.NUM, ErrorMessage.Selector)
      }
      return args[selector - 1]
    })
  }
}
