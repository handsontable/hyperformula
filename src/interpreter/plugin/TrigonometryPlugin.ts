/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing trigonometric functions
 */
export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'ACOS': {
      method: 'acos',
    },
    'ASIN': {
      method: 'asin',
    },
    'COS': {
      method: 'cos',
    },
    'SIN': {
      method: 'sin',
    },
    'TAN': {
      method: 'tan',
    },
    'ATAN': {
      method: 'atan',
    },
    'ATAN2': {
      method: 'atan2',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
      ],
    },
    'COT': {
      method: 'ctg',
    },
  }

  /**
   * Corresponds to ACOS(value)
   *
   * Returns the arc cosine (or inverse cosine) of a number.
   *
   * @param ast
   * @param formulaAddress
   */
  public acos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.acos(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (-1 <= coercedArg && coercedArg <= 1) {
        return Math.asin(coercedArg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, Math.cos)
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, Math.sin)
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, Math.tan)
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, Math.atan)
  }

  public atan2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.ATAN2.parameters, Math.atan2)
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedArg) => {
      if (coercedArg === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return (1 / Math.tan(coercedArg))
      }
    })
  }
}
