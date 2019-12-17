import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class BitwiseOperationsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    bitand: {
      translationKey: 'BITAND',
    },
    bitor: {
      translationKey: 'BITOR',
    },
    bitxor: {
      translationKey: 'BITXOR',
    },
  }

  public bitand(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithTwoPositiveArguments(ast, formulaAddress, (left: number, right: number) => {
      return left & right
    })
  }

  public bitor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithTwoPositiveArguments(ast, formulaAddress, (left: number, right: number) => {
      return left | right
    })
  }

  public bitxor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithTwoPositiveArguments(ast, formulaAddress, (left: number, right: number) => {
      return left ^ right
    })
  }

  protected templateWithTwoPositiveArguments(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (left: number, right: number) => CellValue): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const left = this.evaluateAst(ast.args[0], formulaAddress)
    if (left instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedLeft = coerceScalarToNumber(left)
    if (coercedLeft instanceof CellError) {
      return coercedLeft
    }

    const right = this.evaluateAst(ast.args[1], formulaAddress)
    if (right instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedRight = coerceScalarToNumber(right)
    if (coercedRight instanceof CellError) {
      return coercedRight
    }

    if (coercedLeft < 0 || coercedRight < 0) {
      return new CellError(ErrorType.NUM)
    }

    return fn(coercedLeft, coercedRight)
  }
}
