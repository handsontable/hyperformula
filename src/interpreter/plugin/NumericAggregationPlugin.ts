import {cellError, CellValue, ErrorType, getAbsoluteAddress, SimpleCellAddress} from '../../Cell'
import {findSmallerRange, generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {AstNodeType, CellRangeAst, ProcedureAst} from '../../parser/Ast'
import {add} from '../scalar'
import {FunctionPlugin} from './FunctionPlugin'

export type RangeOperation = (rangeValues: CellValue[]) => CellValue

export class NumericAggregationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    sum: {
      EN: 'SUM',
      PL: 'SUMA',
    },
  }

  public sum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return ast.args.reduce((currentSum: CellValue, arg) => {
      let value
      if (arg.type === AstNodeType.CELL_RANGE) {
        value = this.evaluateRange(arg, formulaAddress, 'SUM', reduceSum)
      } else {
        value = this.evaluateAst(arg, formulaAddress)
      }

      if (typeof currentSum === 'number' && typeof value === 'number') {
        return currentSum + value
      } else {
        return cellError(ErrorType.VALUE)
      }
    }, 0)
  }

  /**
   * Performs range operation on given range
   *
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   * @param functionName - function name to use as cache key
   * @param funcToCalc - range operation
   */
  private evaluateRange(ast: CellRangeAst, formulaAddress: SimpleCellAddress, functionName: string, funcToCalc: RangeOperation): CellValue {
    const rangeStart = getAbsoluteAddress(ast.start, formulaAddress)
    const rangeEnd = getAbsoluteAddress(ast.end, formulaAddress)
    const rangeVertex = this.rangeMapping.getRange(rangeStart, rangeEnd)

    if (!rangeVertex) {
      throw Error('Range does not exists in graph')
    }

    let value = rangeVertex.getFunctionValue(functionName)
    if (!value) {
      const rangeValues = this.getRangeValues(functionName, ast, formulaAddress)
      value = funcToCalc(rangeValues)
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
   * @param ast - cell range ast
   * @param formulaAddress - address of the cell in which formula is located
   */
  private getRangeValues(functionName: string, ast: CellRangeAst, formulaAddress: SimpleCellAddress): CellValue[] {
    const [beginRange, endRange] = [getAbsoluteAddress(ast.start, formulaAddress), getAbsoluteAddress(ast.end, formulaAddress)]
    const rangeResult: CellValue[] = []
    const {smallerRangeVertex, restRangeStart, restRangeEnd} = findSmallerRange(this.rangeMapping, beginRange, endRange)
    const currentRangeVertex = this.rangeMapping.getRange(beginRange, endRange)!
    if (smallerRangeVertex && this.graph.existsEdge(smallerRangeVertex, currentRangeVertex)) {
      rangeResult.push(smallerRangeVertex.getFunctionValue(functionName)!)
    }

    for (const cellFromRange of generateCellsFromRangeGenerator(restRangeStart, restRangeEnd)) {
      rangeResult.push(this.addressMapping.getCell(cellFromRange)!.getCellValue())
    }

    return rangeResult
  }
}

export function reduceSum(rangeValues: CellValue[]): CellValue {
  let acc: CellValue = 0
  for (const val of rangeValues) {
    acc = add(acc, val)
  }
  return acc
}
