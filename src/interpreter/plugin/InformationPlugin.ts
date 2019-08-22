import {CellError, CellValue, EmptyValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    iserror: {
      translationKey: 'ISERROR',
    },
    isblank: {
      translationKey: 'ISBLANK',
    },
    columns: {
      translationKey: 'COLUMNS',
      isDependentOnSheetStructureChange: true,
    },
  }

  /**
   * Corresponds to ISERROR(value)
   *
   * Checks whether provided value is an error
   *
   * @param ast
   * @param formulaAddress
   */
  public iserror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)
      return (arg instanceof CellError)
    }
  }

  /**
   * Corresponds to ISBLANK(value)
   *
   * Checks whether provided cell reference is empty
   *
   * @param ast
   * @param formulaAddress
   */
  public isblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    return (value === EmptyValue)
  }

  /**
   * Corresponds to COLUMNS(range)
   *
   * Returns number of columns in provided range of cells
   *
   * @param ast
   * @param formulaAddress
   */
  public columns(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.type === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.col - rangeAst.start.col + 1)
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }
}
