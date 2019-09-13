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

    const rangeArg = ast.args[1]
    if (rangeArg.type !== AstNodeType.CELL_RANGE) {
      /* gsheet returns REF */
      return new CellError(ErrorType.VALUE)
    }

    const index = this.evaluateAst(ast.args[2], formulaAddress)
    if (typeof index !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    let sorted: CellValue = true
    if (ast.args.length === 4) {
      sorted = this.evaluateAst(ast.args[3], formulaAddress)
      if (typeof sorted !== 'boolean') {
        return new CellError(ErrorType.VALUE)
      }
    }

    const range = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)
    if (index > range.width()) {
      return new CellError(ErrorType.REF)
    }

    return this.doVlookup(key, range, index - 1, sorted)
  }

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): CellValue {
    const searchedRange = AbsoluteCellRange.spanFrom(range.start, 1, range.height())
    const rowIndex = this.columnIndex.find(key, searchedRange)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA)
    }

    const address = range.getAddress(index, rowIndex)
    return this.dependencyGraph.getCellValue(address)
  }
}
