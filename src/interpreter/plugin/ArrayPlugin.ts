/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin>{
  public static implementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'ARRAY_CONSTRAINT': {
      method: 'arrayconstraint',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
      ],
    },
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }

  public arrayconstraint(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('ARRAY_CONSTRAINT'), (range: SimpleRangeValue, num_rows: number, num_cols: number) => {
      num_rows = Math.min(num_rows, range.height())
      num_cols = Math.min(num_cols, range.width())
      const data: InternalScalarValue[][] = range.data
      const ret: InternalScalarValue[][] = []
      for(let i=0;i<num_rows;i++) {
        ret.push(data[i].slice(0,num_cols))
      }
      return SimpleRangeValue.onlyValues(ret)
    })
  }
}
