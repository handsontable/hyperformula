import {CellError, cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress, cellRangeToSimpleCellRange} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'
import {generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {Ast} from '../../parser/Ast'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static timeSpentOnComputingList = 0
  public static timeSpentOnGetCellValue = 0
  public static implementedFunctions = {
    median: {
      EN: 'MEDIAN',
      PL: 'MEDIANA',
    },
  }

  /**
   * Corresponds to MEDIAN(Number1, Number2, ...).
   *
   * Returns a median of given numbers.
   *
   * @param ast
   * @param formulaAddress
   */
  public async median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): Promise<CellValue> {
    if (ast.args.length === 0) {
      return cellError(ErrorType.NA)
    }

    const startedAt = Date.now()
    const values = await this.computeNumericListOfValues(ast.args, formulaAddress)
    const finishedAt = Date.now()
    MedianPlugin.timeSpentOnComputingList += (finishedAt - startedAt)

    if (Array.isArray(values)) {
      values.sort((a, b) => (a - b))

      if (values.length % 2 === 0) {
        return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
      } else {
        return values[Math.floor(values.length / 2)]
      }
    } else {
      return values
    }
  }

  public async computeNumericListOfValues(asts: Ast[], formulaAddress: SimpleCellAddress): Promise<number[] | CellError> {
    const values: number[] = []
    for (const ast of asts) {
      if (ast.type === AstNodeType.CELL_RANGE) {
        for (const cellFromRange of generateCellsFromRangeGenerator(cellRangeToSimpleCellRange(ast, formulaAddress))) {
          const startedAt = Date.now()
          let value
          const vertex = this.addressMapping.getCell(cellFromRange)
          if (vertex.color === this.addressMapping.contextColor) {
            value = vertex.getCellValue()
          } else {
            value = await this.addressMapping.getRemoteCellValueByVertex(cellFromRange, vertex)
          }
          // const value = await this.addressMapping.getCellValue(cellFromRange)
          const finishedAt = Date.now()
          MedianPlugin.timeSpentOnGetCellValue += (finishedAt - startedAt)
          if (typeof value === 'number') {
            values.push(value)
          } else if (isCellError(value)) {
            return value
          } else {
            return cellError(ErrorType.NA)
          }
        }
      } else {
        const value = await this.evaluateAst(ast, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (isCellError(value)) {
          return value
        } else {
          return cellError(ErrorType.NA)
        }
      }
    }
    return Promise.resolve(values)
  }
}
