/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'LOG10': {
      method: 'log10',
      parameters: {
        list: [
          {argumentType: 'number'}
        ]
      },
    },
    'LOG': {
      method: 'log',
      parameters: {
        list: [
          {argumentType: 'number', greaterThan: 0},
          {argumentType: 'number', defaultValue: 10, greaterThan: 0},
        ]
      },
    },
    'LN': {
      method: 'ln',
      parameters: {
        list: [
          {argumentType: 'number'}
        ]
      },
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('LOG10'), Math.log10)
  }

  public log(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('LOG'),
      (arg: number, base: number) => Math.log(arg) / Math.log(base)
    )
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('LN'), Math.log)
  }
}
