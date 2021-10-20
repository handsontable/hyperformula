/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin implements FunctionPluginTypecheck<LogarithmPlugin> {

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

  public log10(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOG10'), Math.log10)
  }

  public log(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOG'),
      (arg: number, base: number) => Math.log(arg) / Math.log(base)
    )
  }

  public ln(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LN'), Math.log)
  }
}
