/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing trigonometric functions
 */
export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'ACOS': {
      method: 'acos',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'ASIN': {
      method: 'asin',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'COS': {
      method: 'cos',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'SIN': {
      method: 'sin',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'TAN': {
      method: 'tan',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'ATAN': {
      method: 'atan',
      parameters: [
        { argumentType: 'number' }
      ],
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
      parameters: [
        { argumentType: 'number' }
      ],
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
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.ACOS, Math.acos)
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.ASIN, Math.asin)
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.COS, Math.cos)
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.SIN, Math.sin)
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.TAN, Math.tan)
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.ATAN, Math.atan)
  }

  public atan2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.ATAN2, Math.atan2)
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, TrigonometryPlugin.implementedFunctions.COT, (coercedArg) => {
      if (coercedArg === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return (1 / Math.tan(coercedArg))
      }
    })
  }
}
