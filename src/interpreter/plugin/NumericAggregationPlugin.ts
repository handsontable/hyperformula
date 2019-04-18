import {AbsoluteCellRange, DIFFERENT_SHEETS_ERROR} from '../../AbsoluteCellRange'
import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress,} from '../../Cell'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser/Ast'
import {add, max, min} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'
import {findSmallerRange} from './SumprodPlugin'

export type BinaryOperation = (left: CellValue, right: CellValue) => CellValue

export class NumericAggregationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sum: {
      EN: 'SUM',
      PL: 'SUMA',
    },
    max: {
      EN: 'MAX',
      PL: 'MAKS'
    },
    min: {
      EN: 'MIN',
      PL: 'MIN'
    }
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
    return this.reduce(ast, formulaAddress, 0, 'SUM', add)
  }

  /**
   * Corresponds to MAX(Number1, Number2, ...).
   *
   * Returns a max of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public max(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return cellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.NEGATIVE_INFINITY, 'MAX', max)

    if (typeof value === 'number' && !Number.isFinite(value)) {
      return 0
    }

    return value
  }

  /**
   * Corresponds to MIN(Number1, Number2, ...).
   *
   * Returns a min of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public min(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return cellError(ErrorType.NA)
    }
    const value = this.reduce(ast, formulaAddress, Number.POSITIVE_INFINITY, 'MIN', min)

    if (typeof value === 'number' && !Number.isFinite(value)) {
      return 0
    }

    return value
  }

  /**
   * Reduces procedure arguments with given reducing function
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param initialAccValue - initial accumulator value for reducing function
   * @param functionName - function name to use as cache key
   * @param reducingFunction - reducing function
   * */
  private reduce(ast: ProcedureAst, formulaAddress: SimpleCellAddress, initialAccValue: CellValue, functionName: string, reducingFunction: BinaryOperation): CellValue {
    return ast.args.reduce((acc: CellValue, arg) => {
      let value
      if (arg.type === AstNodeType.CELL_RANGE) {
        value = this.evaluateRange(arg, formulaAddress, acc, functionName, reducingFunction)
      } else {
        value = this.evaluateAst(arg, formulaAddress)
      }

      return reducingFunction(acc, value)
    }, initialAccValue)
  }

  /**
   * Reduces list of cell values with given reducing function
   *
   * @param rangeValues - list of values to reduce
   * @param initialAccValue - initial accumulator value for reducing function
   * @param reducingFunction - reducing function
   */
  private reduceRange(rangeValues: CellValue[], initialAccValue: CellValue, reducingFunction: BinaryOperation) {
    let acc = initialAccValue
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
   * @param initialAccValue - initial accumulator value for reducing function
   * @param functionName - function name to use as cache key
   * @param reducingFunction - reducing function
   */
  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, initialAccValue: CellValue, functionName: string, reducingFunction: BinaryOperation): CellValue {
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
      value = this.reduceRange(rangeValues, initialAccValue, reducingFunction)
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
