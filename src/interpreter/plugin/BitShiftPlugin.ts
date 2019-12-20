import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

const MAX_48BIT_INTEGER = 281474976710655
const SHIFT_MIN_POSITIONS = -53
const SHIFT_MAX_POSITIONS = 53

export class BitShiftPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    bitlshift: {
      translationKey: 'BITLSHIFT',
    },
    bitrshift: {
      translationKey: 'BITRSHIFT',
    },
  }

  public bitlshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.bitshiftTemplate(ast, formulaAddress, shiftLeft)
  }

  public bitrshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.bitshiftTemplate(ast, formulaAddress, shiftRight)
  }

  private bitshiftTemplate(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (value: number, positions: number) => number): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const value = this.evaluateAst(ast.args[0], formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedValue = coerceScalarToNumber(value)
    if (coercedValue instanceof CellError) {
      return coercedValue
    }

    const positions = this.evaluateAst(ast.args[1], formulaAddress)
    if (positions instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedPositions = coerceScalarToNumber(positions)
    if (coercedPositions instanceof CellError) {
      return coercedPositions
    }

    if (coercedValue < 0 || !Number.isInteger(coercedValue) || !Number.isInteger(coercedPositions)) {
      return new CellError(ErrorType.NUM)
    }

    if (coercedPositions < SHIFT_MIN_POSITIONS || coercedPositions > SHIFT_MAX_POSITIONS) {
      return new CellError(ErrorType.NUM)
    }

    const result = fn(coercedValue, coercedPositions)

    if (result > MAX_48BIT_INTEGER) {
      return new CellError(ErrorType.NUM)
    } else {
      return result
    }
  }
}

function shiftLeft(value: number, positions: number): number {
  if (positions < 0) {
    return shiftRight(value, -positions)
  } else {
    return value * Math.pow(2, positions)
  }
}

function shiftRight(value: number, positions: number): number {
  if (positions < 0) {
    return shiftLeft(value, -positions)
  } else {
    return Math.floor(value / Math.pow(2, positions))
  }
}
