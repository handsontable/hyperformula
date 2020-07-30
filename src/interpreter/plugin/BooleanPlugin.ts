/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalNoErrorCellValue, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'TRUE': {
      method: 'literalTrue',
      parameters: {list: []},
    },
    'FALSE': {
      method: 'literalFalse',
      parameters: {list: []},
    },
    'IF': {
      method: 'conditionalIf',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.BOOLEAN},
          {argumentType: ArgumentTypes.SCALAR},
          {argumentType: ArgumentTypes.SCALAR, defaultValue: false},
        ]
      },
    },
    'AND': {
      method: 'and',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.BOOLEAN},
        ],
        repeatedArg: true,
        expandRanges: true,
      },
    },
    'OR': {
      method: 'or',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.BOOLEAN},
        ],
        repeatedArg: true,
        expandRanges: true,
      },
    },
    'XOR': {
      method: 'xor',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.BOOLEAN},
        ],
        repeatedArg: true,
        expandRanges: true,
      },
    },
    'NOT': {
      method: 'not',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.BOOLEAN},
        ]
      },
    },
    'SWITCH': {
      method: 'switch',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NOERROR},
          {argumentType: ArgumentTypes.SCALAR},
          {argumentType: ArgumentTypes.SCALAR},
        ],
        repeatedArg: true,
      },
    },
    'IFERROR': {
      method: 'iferror',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.SCALAR},
          {argumentType: ArgumentTypes.SCALAR},
        ]
      },
    },
    'IFNA': {
      method: 'ifna',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.SCALAR},
          {argumentType: ArgumentTypes.SCALAR},
        ]
      },
    },
    'CHOOSE': {
      method: 'choose',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.SCALAR},
        ],
        repeatedArg: true,
      },
    },
  }

  /**
   * Corresponds to TRUE()
   *
   * Returns the logical true
   *
   * @param ast
   * @param formulaAddress
   */
  public literalTrue(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('TRUE'), () => true)
  }

  /**
   * Corresponds to FALSE()
   *
   * Returns the logical false
   *
   * @param ast
   * @param formulaAddress
   */
  public literalFalse(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('FALSE'), () => false)
  }

  /**
   * Corresponds to IF(expression, value_if_true, value_if_false)
   *
   * Returns value specified as second argument if expression is true and third argument if expression is false
   *
   * @param ast
   * @param formulaAddress
   */
  public conditionalIf(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InterpreterValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('IF'), (condition, arg2, arg3) => {
      return condition ? arg2 : arg3
    })
  }

  /**
   * Corresponds to AND(expression1, [expression2, ...])
   *
   * Returns true if all of the provided arguments are logically true, and false if any of it is logically false
   *
   * @param ast
   * @param formulaAddress
   */
  public and(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('AND'),
      (...args) => !args.some((arg: boolean) => !arg)
    )
  }

  /**
   * Corresponds to OR(expression1, [expression2, ...])
   *
   * Returns true if any of the provided arguments are logically true, and false otherwise
   *
   * @param ast
   * @param formulaAddress
   */
  public or(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('OR'),
      (...args) => args.some((arg: boolean) => arg)
    )
  }

  public not(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('NOT'), (arg) => !arg)
  }

  public xor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('XOR'), (...args) => {
      let cnt = 0
      args.forEach((arg: boolean) => {
        if (arg) {
          cnt++
        }
      })
      return (cnt % 2) === 1
    })
  }

  public switch(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SWITCH'), (selector, ...args) => {
      const n = args.length
      let i = 0
      for (; i + 1 < n; i += 2) {
        if (args[i] instanceof CellError) {
          continue
        }
        if (this.interpreter.arithmeticHelper.compare(selector, args[i] as InternalNoErrorCellValue) === 0) {
          return args[i + 1]
        }
      }
      if (i < n) {
        return args[i]
      } else {
        return new CellError(ErrorType.NA)
      }
    })
  }

  public iferror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('IFERROR'), (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if (arg1 instanceof CellError) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public ifna(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('IFNA'), (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if (arg1 instanceof CellError && arg1.type === ErrorType.NA) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public choose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('CHOOSE'), (selector, ...args) => {
      if (selector !== Math.round(selector) || selector < 1 || selector > args.length) {
        return new CellError(ErrorType.NUM)
      }
      return args[selector - 1]
    })
  }
}
