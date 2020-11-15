/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {geomean} from './3rdparty/jstat/jstat'
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
    'DEVSQ': {
      method: 'devsq',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'GEOMEAN': {
      method: 'geomean',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'HARMEAN': {
      method: 'harmean',
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

  public devsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DEVSQ'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return 0
        }
        const avg = (coerced.reduce((a,b) => a+b, 0))/coerced.length
        return coerced.reduce((a,b) => a + Math.pow(b-avg,2), 0)
      })
  }

  public geomean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GEOMEAN'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        for(const val of coerced) {
          if(val <= 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
        }
        return geomean(coerced)
      })
  }

  public harmean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HARMEAN'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        for(const val of coerced) {
          if(val <= 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
        }
        return coerced.length/(coerced.reduce((a,b) => a+1/b, 0))
      })
  }
}

