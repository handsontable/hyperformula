import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'
import {AbsoluteCellRange} from "../../AbsoluteCellRange";

export class VlookupPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    vlookup: {
      translationKey: 'VLOOKUP',
    },
  }

  /**
   * Corresponds to VLOOKUP(key, range, index, [sorted])
   *
   * @param ast
   * @param formulaAddress
   */
  public vlookup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 3 || ast.args.length > 4) {
      return new CellError(ErrorType.NA)
    }

    const key = this.evaluateAst(ast.args[0], formulaAddress)
    if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean') {
      return new CellError(ErrorType.VALUE)
    }

    const range = ast.args[1]
    if (range.type !== AstNodeType.CELL_RANGE) {
      /* gsheet returns REF */
      return new CellError(ErrorType.VALUE)
    }

    const index = this.evaluateAst(ast.args[2], formulaAddress)
    if (typeof index !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    let sorted = true
    if (ast.args.length === 4) {
      const sorted = this.evaluateAst(ast.args[3], formulaAddress)
      if (typeof sorted !== 'boolean') {
        return new CellError(ErrorType.VALUE)
      }
    }

    return this.doVlookup(key, AbsoluteCellRange.fromCellRange(range, formulaAddress), index, sorted)
  }

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): CellValue {
    return 0
  }
}
