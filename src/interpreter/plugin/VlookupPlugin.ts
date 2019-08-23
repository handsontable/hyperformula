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

    let sorted = true
    if (ast.args.length === 4) {
      const sorted = this.evaluateAst(ast.args[3], formulaAddress)
      if (typeof sorted !== 'boolean') {
        return new CellError(ErrorType.VALUE)
      }
    }

    const range = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)
    if (index > range.width()) {
      return new CellError(ErrorType.REF)
    }

    return this.doVlookup(key, range , index, sorted)
  }

  private doVlookup(key: any, range: AbsoluteCellRange, index: number, sorted: boolean): CellValue {
    const searchedRange = AbsoluteCellRange.spanFrom(range.start, 1, range.height())
    const values = this.computeListOfValuesInRange(searchedRange)

    const rowIndex = this.binSearch(values, key)

    if (rowIndex === -1) {
      return new CellError(ErrorType.NA)
    }

    const address = range.getAddress(index - 1, rowIndex)
    return this.dependencyGraph.getCellValue(address)
  }

  private binSearch(values: CellValue[], key: any): number {
    let start = 0
    let end = values.length - 1

    while (start <= end) {
      let center = Math.floor((start + end) / 2)
      let cmp = this.compare(key, values[center])
      if (cmp > 0) {
        start = center + 1
      } else if (cmp < 0) {
        end = center - 1
      } else {
        return center
      }
    }

     return -1
  }

  /*
  * numbers < strings < false < true
  * */
  private compare(left: any, right: any): number {
    if (typeof left === typeof right) {
      return (left < right ? - 1 : (left > right ? 1 : 0))
    }
    if (typeof left === 'number' && typeof right === 'string') {
      return -1
    }
    if (typeof left === 'number' && typeof right === 'boolean') {
      return -1
    }
    if (typeof left === 'string' && typeof right === 'number') {
      return 1
    }
    if (typeof left === 'string' && typeof right === 'boolean') {
      return -1
    }
    return 1
  }
}
