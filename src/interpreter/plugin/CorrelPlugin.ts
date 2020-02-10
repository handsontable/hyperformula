import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceToRange} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class CorrelPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    correl: {
      translationKey: 'CORREL',
    },
  }

  public correl(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 2) {
      return new CellError(ErrorType.NA)
    }

    const dataX = coerceToRange(this.evaluateAst(ast.args[0], formulaAddress))
    const dataY = coerceToRange(this.evaluateAst(ast.args[1], formulaAddress))

    if (dataX.numberOfElements() !== dataY.numberOfElements()) {
      return new CellError(ErrorType.NA)
    }

    if (dataX.numberOfElements() <= 1) {
      return new CellError(ErrorType.DIV_BY_ZERO)
    }

    return this.computePearson(dataX, dataY)
  }

  private computePearson(dataX: SimpleRangeValue, dataY: SimpleRangeValue): number | CellError {
    const xit = dataX.valuesFromTopLeftCorner()
    const yit = dataY.valuesFromTopLeftCorner()
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
