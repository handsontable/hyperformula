/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceToRange} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class CorrelPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CORREL': {
      method: 'correl',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
  }

  public correl(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CORREL'), (dataX: SimpleRangeValue, dataY: SimpleRangeValue) => {
      if (dataX.numberOfElements() !== dataY.numberOfElements()) {
        return new CellError(ErrorType.NA, 'Ranges need to be of equal length.')
      }

      if (dataX.numberOfElements() <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO, 'Range needs to contain at least two elements.')
      }

      return this.computePearson(dataX, dataY)
    })
  }

  private computePearson(dataX: SimpleRangeValue, dataY: SimpleRangeValue): number | CellError {
    const xit = dataX.iterateValuesFromTopLeftCorner()
    const yit = dataY.iterateValuesFromTopLeftCorner()
    let x, y

    let count = 0
    let sumX = 0
    let sumY = 0
    let sumXsquares = 0
    let sumYsquares = 0
    let sumOfProducts = 0

    while (x = xit.next(), y = yit.next(), !x.done && !y.done) {
      const xval = x.value
      const yval = y.value
      if (xval instanceof CellError) {
        return xval
      } else if (yval instanceof CellError) {
        return yval
      } else if (typeof xval === 'number' && typeof yval === 'number') {
        count++
        sumX += xval
        sumY += yval
        sumXsquares += xval * xval
        sumYsquares += yval * yval
        sumOfProducts += xval * yval
      }
    }

    return (
      (count * sumOfProducts - sumX * sumY) /
      (Math.sqrt(count * sumXsquares - sumX * sumX) * Math.sqrt(count * sumYsquares - sumY * sumY))
    )
  }
}
