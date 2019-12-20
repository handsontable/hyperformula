import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class BitwiseLogicOperationsPlugin extends FunctionPlugin {
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
    return this.templateWithTwoPositiveIntegerArguments(ast, formulaAddress, (left: number, right: number) => {
      return left & right
    })
  }

  public bitor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithTwoPositiveIntegerArguments(ast, formulaAddress, (left: number, right: number) => {
      return left | right
    })
  }

  public bitxor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithTwoPositiveIntegerArguments(ast, formulaAddress, (left: number, right: number) => {
      return left ^ right
    })
  }

  private templateWithTwoPositiveIntegerArguments(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (left: number, right: number) => CellValue): CellValue {
    const validationResult = this.validateTwoNumericArguments(ast, formulaAddress)

    if (validationResult instanceof CellError) {
      return validationResult
    }

    const [coercedLeft, coercedRight] = validationResult
    if (coercedLeft < 0 || coercedRight < 0 || !Number.isInteger(coercedLeft) || !Number.isInteger(coercedRight)) {
      return new CellError(ErrorType.NUM)
    }

    return fn(coercedLeft, coercedRight)
  }
}
