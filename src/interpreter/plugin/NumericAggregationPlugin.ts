import {AbsoluteCellRange, DIFFERENT_SHEETS_ERROR} from '../../AbsoluteCellRange'
import {
  cellError,
  CellValue,
  ErrorType,
  getAbsoluteAddress,
  SimpleCellAddress,
} from '../../Cell'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser/Ast'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import {findSmallerRange} from './SumprodPlugin'

export type BinaryOperation = (left: CellValue, right: CellValue) => CellValue

export class NumericAggregationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sum: {
      EN: 'SUM',
      PL: 'SUMA',
    },
  }

  /**
   * Corresponds to SUM(Number1, Number2, ...).
   *
   * Returns a sum of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.reduce(ast, formulaAddress, 'SUM', add)
  }

  private reduce(ast: ProcedureAst, formulaAddress: SimpleCellAddress, functionName: string, reducingFunction: BinaryOperation): CellValue {
    return ast.args.reduce((currentSum: CellValue, arg) => {
      let value
      if (arg.type === AstNodeType.CELL_RANGE) {
        value = this.evaluateRange(arg, formulaAddress, functionName, reducingFunction)
      } else {
        value = this.evaluateAst(arg, formulaAddress)
      }

      return reducingFunction(currentSum, value)
    }, 0)
  }

  private reduceRange(rangeValues: CellValue[], reducingFunction: BinaryOperation) {
    let acc: CellValue = 0
    for (const val of rangeValues) {
      acc = reducingFunction(acc, val)
    }
    return acc
  }

  /**
   * Performs range operation on given range
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param functionName - function name to use as cache key
   * @param funcToCalc - range operation
   */
  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: BinaryOperation): CellValue {
    let range
    try {
      range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
    } catch (err) {
      if (err.message === DIFFERENT_SHEETS_ERROR) {
        return cellError(ErrorType.VALUE)
      } else {
        throw err
      }
    }
    const rangeStart = getAbsoluteAddress(ast.start, formulaAddress)
    const rangeEnd = getAbsoluteAddress(ast.end, formulaAddress)
    const rangeVertex = this.rangeMapping.getRange(rangeStart, rangeEnd)

    if (!rangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let value = rangeVertex.getFunctionValue(functionName)
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, range)
      value = this.reduceRange(rangeValues, funcToCalc)
      rangeVertex.setFunctionValue(functionName, value)
    }

    return value
  }

  /**
   * Returns list of values for given range and function name
   *
   * If range is dependent on smaller range, list will contain value of smaller range for this function
   * and values of cells that are not present in smaller range
   *
   * @param functionName - function name (e.g. SUM)
   * @param range - cell range
   */
  private getRangeValues(functionName: string, range: AbsoluteCellRange): CellValue[] {
    const rangeResult: CellValue[] = []
    const {smallerRangeVertex, restRanges} = findSmallerRange(this.rangeMapping, [range])
    const restRange = restRanges[0]
    const currentRangeVertex = this.rangeMapping.getRange(range.start, range.end)!
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      rangeResult.push(smallerRangeVertex.getFunctionValue(functionName)!)
    }
    for (const cellFromRange of restRange.generateCellsFromRangeGenerator()) {
      rangeResult.push(this.addressMapping.getCellValue(cellFromRange))
    }

    return rangeResult
  }
}
