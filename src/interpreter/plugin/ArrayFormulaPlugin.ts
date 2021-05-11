/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ArrayFormulaPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayFormulaPlugin>{
  public static implementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'FILTER': {
      method: 'filter',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
      repeatLastArgs: 1,
    }
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }

  public filter(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('FILTER'), (rangeVals: SimpleRangeValue, ...rangeFilters: SimpleRangeValue[]) => {
      for(const filter of rangeFilters) {
        if (rangeVals.width() !== filter.width() || rangeVals.height() !== filter.height()) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
      }
      if(rangeVals.width()>1 && rangeVals.height()>1) {
        return new CellError(ErrorType.NA, ErrorMessage.WrongDimension)
      }
      const vals = rangeVals.data
      const ret = []
      for(let i=0;i<rangeVals.height();i++) {
        const row = []
        for(let j=0;j<rangeVals.width();j++) {
          let ok = true
          for(const filter of rangeFilters) {
            const val = coerceScalarToBoolean(filter.data[i][j])
            if(val !== true) {
              ok = false
              break
            }
          }
          if(ok) {
            row.push(vals[i][j])
          }
        }
        if(row.length>0) {
          ret.push(row)
        }
      }
      if(ret.length>0) {
        return SimpleRangeValue.onlyValues(ret)
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
      }
    })
  }
}
