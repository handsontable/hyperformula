/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class StatisticalAggregationPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'AVEDEV': {
      method: 'avedev',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
  }

  public avedev(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('AVEDEV'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        const avg = (coerced.reduce((a,b) => a+b, 0))/coerced.length
        return coerced.reduce((a,b) => a + Math.abs(b-avg), 0)/coerced.length
      })
  }

}

