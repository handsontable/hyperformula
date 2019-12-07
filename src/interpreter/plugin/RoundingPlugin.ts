import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'
import {coerceScalarToNumber} from '../coerce'

export class RoundingPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    roundup: {
      translationKey: 'ROUNDUP',
    },
  }

  public roundup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    } else {
      const numberToRound = this.evaluateAst(ast.args[0], formulaAddress)
      if (numberToRound instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      let coercedPlaces
      if (ast.args[1]) {
        const places = this.evaluateAst(ast.args[1], formulaAddress)
        if (places instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        coercedPlaces = coerceScalarToNumber(places)
      } else {
        coercedPlaces = 0
      }

      const coercedNumberToRound = coerceScalarToNumber(numberToRound)
      if (coercedNumberToRound instanceof CellError) {
        return coercedNumberToRound
      } else if (coercedPlaces instanceof CellError) {
        return coercedPlaces
      } else {
        const placesMultiplier = Math.pow(10, coercedPlaces)
        if (coercedNumberToRound < 0) {
          return -Math.ceil(-coercedNumberToRound * placesMultiplier) / placesMultiplier
        } else {
          return Math.ceil(coercedNumberToRound * placesMultiplier) / placesMultiplier
        }
      }
    }
  }
}
