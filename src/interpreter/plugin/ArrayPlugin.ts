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
    'ARRAY_CONSTRAIN': {
      method: 'arrayconstrain',
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

  public arrayconstrain(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('ARRAY_CONSTRAIN'), (range: SimpleRangeValue, numRows: number, numCols: number) => {
      numRows = Math.min(numRows, range.height())
      numCols = Math.min(numCols, range.width())
      const data: InternalScalarValue[][] = range.data
      const ret: InternalScalarValue[][] = []
      for(let i=0;i<numRows;i++) {
        ret.push(data[i].slice(0, numCols))
      }
      return SimpleRangeValue.onlyValues(ret)
    })
  }
}
