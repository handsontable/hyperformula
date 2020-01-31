import {CellError, InternalCellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
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

  public bitlshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.bitshiftTemplate(ast, formulaAddress, shiftLeft)
  }

  public bitrshift(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.bitshiftTemplate(ast, formulaAddress, shiftRight)
  }

  private bitshiftTemplate(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (value: number, positions: number) => number): InternalCellValue {
    const validationResult = this.validateTwoNumericArguments(ast, formulaAddress)

    if (validationResult instanceof CellError) {
      return validationResult
    }

    const [coercedValue, coercedPositions] = validationResult

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
