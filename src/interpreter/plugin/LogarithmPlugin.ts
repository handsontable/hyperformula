/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'LOG10': {
      method: 'log10',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
    'LOG': {
      method: 'log',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 10, greaterThan: 0},
        ]
    },
    'LN': {
      method: 'ln',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LOG10'), Math.log10)
  }

  public log(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LOG'),
      (arg: number, base: number) => Math.log(arg) / Math.log(base)
    )
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LN'), Math.log)
  }
}
