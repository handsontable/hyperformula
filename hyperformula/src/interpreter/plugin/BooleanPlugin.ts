/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalNoErrorScalarValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * For a call to `IF`, `IFS`, `SWITCH` or `CHOOSE`, the argument that its last evaluation returned. A call
 * that returned none of its arguments, such as one whose selector is an error or out of range, one where
 * no condition or case matched, one that returned the default value of an omitted argument, or one that
 * returned an array, has no entry.
 */
const selectedArguments = new WeakMap<ProcedureAst, Ast>()

/**
 * Returns the argument that the call to `IF`, `IFS`, `SWITCH` or `CHOOSE` returned when it was last
 * evaluated, so that a function that has just evaluated the call can tell whether its result is the
 * content of a referenced cell.
 *
 * @param {ProcedureAst} ast - a call to `IF`, `IFS`, `SWITCH` or `CHOOSE` evaluated by this plugin
 * @returns {Maybe<Ast>} the returned argument, or `undefined` when the call returned none of its arguments
 */
export function selectedArgument(ast: ProcedureAst): Maybe<Ast> {
  return selectedArguments.get(ast)
}

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin implements FunctionPluginTypecheck<BooleanPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
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
        {argumentType: FunctionArgumentType.BOOLEAN},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: false, passSubtype: true},
      ],
    },
    'IFS': {
      method: 'ifs',
      parameters: [
        {argumentType: FunctionArgumentType.BOOLEAN},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
      ],
      repeatLastArgs: 2,
    },
    'AND': {
      method: 'and',
      parameters: [
        {argumentType: FunctionArgumentType.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'OR': {
      method: 'or',
      parameters: [
        {argumentType: FunctionArgumentType.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'XOR': {
      method: 'xor',
      parameters: [
        {argumentType: FunctionArgumentType.BOOLEAN},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'NOT': {
      method: 'not',
      parameters: [
        {argumentType: FunctionArgumentType.BOOLEAN},
      ]
    },
    'SWITCH': {
      method: 'switch',
      parameters: [
        {argumentType: FunctionArgumentType.NOERROR},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
      ],
      repeatLastArgs: 1,
    },
    'IFERROR': {
      method: 'iferror',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
      ]
    },
    'IFNA': {
      method: 'ifna',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
      ]
    },
    'CHOOSE': {
      method: 'choose',
      parameters: [
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.SCALAR, passSubtype: true},
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
    selectedArguments.delete(ast)
    const result = this.runFunction(ast.args, state, this.metadata('IF'), (condition, arg2, arg3) => {
      recordSelectedArgument(ast, condition ? 1 : 2)
      return condition ? arg2 : arg3
    })
    return forgetSelectionUnlessScalar(ast, result)
  }

  /**
   * Implementation for the IFS function. Returns the value that corresponds to the first true condition.
   *
   * @param ast
   * @param state
   */
  public ifs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    selectedArguments.delete(ast)
    const result = this.runFunction(ast.args, state, this.metadata('IFS'), (...args) => {
      for (let idx = 0; idx < args.length; idx += 2) {
        if (args[idx]) {
          recordSelectedArgument(ast, idx + 1)
          return args[idx+1]
        }
      }
      return new CellError(ErrorType.NA, ErrorMessage.NoConditionMet)
    })
    return forgetSelectionUnlessScalar(ast, result)
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
      (...args: (boolean | undefined)[]) => args.filter(arg => arg !== undefined).every(arg => !!arg)
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
      (...args: (boolean | undefined)[]) => args.filter(arg => arg !== undefined).some(arg => arg)
    )
  }

  public not(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NOT'), (arg) => !arg)
  }

  public xor(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XOR'), (...args: (boolean | undefined)[]) => {
      let cnt = 0
      args.filter(arg => arg !== undefined).forEach(arg => {
        if (arg) {
          cnt++
        }
      })
      return (cnt % 2) === 1
    })
  }

  public switch(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    selectedArguments.delete(ast)
    const result = this.runFunction(ast.args, state, this.metadata('SWITCH'), (selector, ...args) => {
      const n = args.length
      let i = 0
      for (; i + 1 < n; i += 2) {
        if (args[i] instanceof CellError) {
          continue
        }
        if (this.arithmeticHelper.eq(selector, args[i] as InternalNoErrorScalarValue)) {
          recordSelectedArgument(ast, i + 2)
          return args[i + 1]
        }
      }
      if (i < n) {
        recordSelectedArgument(ast, i + 1)
        return args[i]
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.NoDefault)
      }
    })
    return forgetSelectionUnlessScalar(ast, result)
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
    selectedArguments.delete(ast)
    const result = this.runFunction(ast.args, state, this.metadata('CHOOSE'), (selector: number, ...args) => {
      if (selector > args.length) {
        return new CellError(ErrorType.NUM, ErrorMessage.Selector)
      }
      recordSelectedArgument(ast, selector)
      return args[selector - 1]
    })
    return forgetSelectionUnlessScalar(ast, result)
  }
}

/**
 * Records that a call to `IF`, `IFS`, `SWITCH` or `CHOOSE` returned its argument at the given position.
 *
 * @param {ProcedureAst} ast - the call
 * @param {number} position - the position of the returned argument in `ast.args`
 */
function recordSelectedArgument(ast: ProcedureAst, position: number): void {
  const argument = ast.args[position]
  if (argument === undefined) {
    selectedArguments.delete(ast)
  } else {
    selectedArguments.set(ast, argument)
  }
}

/**
 * Removes the record of a call that returned an array, where each cell can come from a different argument.
 *
 * @param {ProcedureAst} ast - the call
 * @param {InterpreterValue} result - what the call returned
 * @returns {InterpreterValue} `result`, unchanged
 */
function forgetSelectionUnlessScalar(ast: ProcedureAst, result: InterpreterValue): InterpreterValue {
  if (result instanceof SimpleRangeValue) {
    selectedArguments.delete(ast)
  }
  return result
}
