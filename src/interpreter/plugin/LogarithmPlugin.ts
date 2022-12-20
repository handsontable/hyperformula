/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin implements FunctionPluginTypecheck<LogarithmPlugin> {

  public static implementedFunctions = {
    'LOG10': {
      method: 'log10',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
      ]
    },
    'LOG': {
      method: 'log',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 10, greaterThan: 0},
      ]
    },
    'LN': {
      method: 'ln',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER}
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
