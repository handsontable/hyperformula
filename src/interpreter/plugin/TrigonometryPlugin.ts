/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing trigonometric functions
 */
export class TrigonometryPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'ACOS': {
      method: 'acos',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'ASIN': {
      method: 'asin',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'COS': {
      method: 'cos',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'SIN': {
      method: 'sin',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'TAN': {
      method: 'tan',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'ATAN': {
      method: 'atan',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'ATAN2': {
      method: 'atan2',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ]
    },
    'COT': {
      method: 'ctg',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'SEC': {
      method: 'sec',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
    'CSC': {
      method: 'cosec',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('ACOS'), Math.acos)
  }

  public asin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ASIN'), Math.asin)
  }

  public cos(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COS'), Math.cos)
  }

  public sin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SIN'), Math.sin)
  }

  public tan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TAN'), Math.tan)
  }

  public atan(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ATAN'), Math.atan)
  }

  public atan2(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ATAN2'), Math.atan2)
  }

  public ctg(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COT'),
      (arg) => (arg === 0) ? new CellError(ErrorType.DIV_BY_ZERO) : (1 / Math.tan(arg))
    )
  }

  public sec(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SEC'),
      (arg: number) => 1 / Math.cos(arg)
    )
  }
  
  public cosec(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CSC'),
      (arg) => (arg === 0) ? new CellError(ErrorType.DIV_BY_ZERO) : (1 / Math.sin(arg))
    )
  }
}
