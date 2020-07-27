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
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'ASIN': {
      method: 'asin',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'COS': {
      method: 'cos',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'SIN': {
      method: 'sin',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'TAN': {
      method: 'tan',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'ATAN': {
      method: 'atan',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
    },
    'ATAN2': {
      method: 'atan2',
      parameters: { list: [
        { argumentType: 'number' },
        { argumentType: 'number' },
      ]}
    },
    'COT': {
      method: 'ctg',
      parameters: { list: [
        { argumentType: 'number' }
      ]}
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('ACOS'), Math.acos)
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ASIN'), Math.asin)
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('COS'), Math.cos)
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SIN'), Math.sin)
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('TAN'), Math.tan)
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ATAN'), Math.atan)
  }

  public atan2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ATAN2'), Math.atan2)
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('COT'), (coercedArg) => {
      if (coercedArg === 0) {
        return new CellError(ErrorType.DIV_BY_ZERO)
      } else {
        return (1 / Math.tan(coercedArg))
      }
    })
  }
}
