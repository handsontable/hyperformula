/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalNoErrorCellValue, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin {
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
        { argumentType: 'boolean' },
        { argumentType: 'scalar' },
        { argumentType: 'scalar', defaultValue: false },
      ],
    },
    'AND': {
      method: 'and',
      parameters: [
        { argumentType: 'boolean' },
      ],
    },
    'OR': {
      method: 'or',
      parameters: [
        { argumentType: 'boolean' },
      ],
    },
    'XOR': {
      method: 'xor',
      parameters: [
        { argumentType: 'boolean' },
      ],
    },
    'NOT': {
      method: 'not',
      parameters: [
        { argumentType: 'boolean' },
      ],
    },
    'SWITCH': {
      method: 'switch',
      parameters: [
        { argumentType: 'noerror' },
        { argumentType: 'scalar' },
        { argumentType: 'scalar' },
      ],
    },
    'IFERROR': {
      method: 'iferror',
      parameters: [
        { argumentType: 'scalar' },
        { argumentType: 'scalar' },
      ],
    },
    'IFNA': {
      method: 'ifna',
      parameters: [
        { argumentType: 'scalar' },
        { argumentType: 'scalar' },
      ],
    },
    'CHOOSE': {
      method: 'choose',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'scalar' },
      ],
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
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.TRUE.parameters, () => true)
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
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.FALSE.parameters, () => false)
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
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.IF.parameters, (condition, arg2, arg3) => {
      if(condition===undefined) {
        return new CellError(ErrorType.VALUE)
      } else {
        return condition ? arg2 : arg3
      }
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
    return this.runFunctionWithRepeatedArg(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.AND.parameters, 1, (...args) => {
      if(args.some((arg: Maybe<InternalScalarValue>) => arg===false)) {
        return false
      } else if(args.some((arg: Maybe<InternalScalarValue>) => arg!==undefined)) {
        return true
      } else {
        return new CellError(ErrorType.VALUE)
      }
    })
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
    return this.runFunctionWithRepeatedArg(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.OR.parameters, 1, (...args) => {
      if(args.some((arg: Maybe<InternalScalarValue>) => arg===true)) {
        return true
      } else if(args.some((arg: Maybe<InternalScalarValue>) => arg!==undefined)) {
        return false
      } else {
        return new CellError(ErrorType.VALUE)
      }
    })
  }

  public not(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.NOT.parameters, (arg) => {
      if(arg===undefined) {
        return new CellError(ErrorType.VALUE)
      } else {
        return !arg
      }
    })
  }

  public xor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithRepeatedArg(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.XOR.parameters, 1, (...args) => {
      if(args.some((arg: Maybe<InternalScalarValue>) => arg!==undefined)) {
        let cnt = 0
        args.forEach((arg: Maybe<InternalScalarValue>) => {
          if( arg===true ) {
            cnt++
          }
        })
        return (cnt%2) === 1
      } else {
        return new CellError(ErrorType.VALUE)
      }
    })
  }

  public switch(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithRepeatedArgNoRanges(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.SWITCH.parameters, 1, (selector, ...args) => {
      const n = args.length
      let i  = 0
      for (; i + 1 < n; i += 2) {
        if (args[i] instanceof CellError) {
          continue
        }
        if (this.interpreter.arithmeticHelper.compare(selector, args[i] as InternalNoErrorCellValue) === 0) {
          return args[i+1]
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
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.IFERROR.parameters, (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if(arg1 instanceof CellError) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public ifna(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.IFNA.parameters, (arg1: InternalScalarValue, arg2: InternalScalarValue) => {
      if(arg1 instanceof CellError && arg1.type === ErrorType.NA) {
        return arg2
      } else {
        return arg1
      }
    })
  }

  public choose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithRepeatedArgNoRanges(ast.args, formulaAddress, BooleanPlugin.implementedFunctions.CHOOSE.parameters, 1,(selector, ...args) => {
      if(selector !== Math.round(selector) || selector<1 || selector > args.length) {
        return new CellError(ErrorType.NUM)
      }
      return args[selector-1]
    })
  }
}
