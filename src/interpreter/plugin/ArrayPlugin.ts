/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin> {
  public static implementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      arraySizeMethod: 'arrayformulaArraySize',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.ANY}
      ],
    },
    'ARRAY_CONSTRAIN': {
      method: 'arrayconstrain',
      arraySizeMethod: 'arrayconstrainArraySize',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
      ],
      vectorizationForbidden: true,
    },
    'FILTER': {
      method: 'filter',
      arraySizeMethod: 'filterArraySize',
      arrayFunction: true,
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
      repeatLastArgs: 1,
    }
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }

  public arrayformulaArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAYFORMULA')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))

    return subChecks[0]
  }

  public arrayconstrain(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAY_CONSTRAIN'), (range: SimpleRangeValue, numRows: number, numCols: number) => {
      numRows = Math.min(numRows, range.height())
      numCols = Math.min(numCols, range.width())
      const data: InternalScalarValue[][] = range.data
      const ret: InternalScalarValue[][] = []
      for (let i = 0; i < numRows; i++) {
        ret.push(data[i].slice(0, numCols))
      }
      return SimpleRangeValue.onlyValues(ret)
    })
  }

  public arrayconstrainArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAY_CONSTRAIN')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))

    let {height, width} = subChecks[0]
    if (ast.args[1].type === AstNodeType.NUMBER) {
      height = Math.min(height, ast.args[1].value)
    }
    if (ast.args[2].type === AstNodeType.NUMBER) {
      width = Math.min(width, ast.args[2].value)
    }
    if (height < 1 || width < 1 || !Number.isInteger(height) || !Number.isInteger(width)) {
      return ArraySize.error()
    }
    return new ArraySize(width, height)
  }

  public filter(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FILTER'), (rangeVals: SimpleRangeValue, ...rangeFilters: SimpleRangeValue[]) => {
      for (const filter of rangeFilters) {
        if (rangeVals.width() !== filter.width() || rangeVals.height() !== filter.height()) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
      }
      if (rangeVals.width() > 1 && rangeVals.height() > 1) {
        return new CellError(ErrorType.NA, ErrorMessage.WrongDimension)
      }
      const vals = rangeVals.data
      const ret = []
      for (let i = 0; i < rangeVals.height(); i++) {
        const row = []
        for (let j = 0; j < rangeVals.width(); j++) {
          let ok = true
          for (const filter of rangeFilters) {
            const val = coerceScalarToBoolean(filter.data[i][j])
            if (val !== true) {
              ok = false
              break
            }
          }
          if (ok) {
            row.push(vals[i][j])
          }
        }
        if (row.length > 0) {
          ret.push(row)
        }
      }
      if (ret.length > 0) {
        return SimpleRangeValue.onlyValues(ret)
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
      }
    })
  }

  public filterArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length <= 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('FILTER')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))

    const width = Math.max(...(subChecks).map(val => val.width))
    const height = Math.max(...(subChecks).map(val => val.height))
    return new ArraySize(width, height)
  }
}
