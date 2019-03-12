import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {EmptyCellVertex} from '../../Vertex'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    iserror: {
      EN: 'ISERROR',
      PL: 'CZYBLAD',
    },
    isblank: {
      EN: 'ISBLANK',
      PL: 'CZYPUSTA',
    },
    columns: {
      EN: 'COLUMNS',
      PL: 'LICZBAKOLUMN',
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
      return cellError(ErrorType.NA)
    } else {
      const arg = this.evaluateAst(ast.args[0], formulaAddress)
      return isCellError(arg)
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
      return cellError(ErrorType.NA)
    }
    const arg = ast.args[0]
    if (arg.kind === AstNodeType.CELL_REFERENCE) {
      const address = getAbsoluteAddress(arg.reference, formulaAddress)
      const vertex = this.addressMapping.getCell(address)
      return (vertex === EmptyCellVertex.getSingletonInstance())
    } else {
      return false
    }
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
      return cellError(ErrorType.NA)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.kind === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.col - rangeAst.start.col + 1)
    } else {
      return cellError(ErrorType.VALUE)
    }
  }
}
