import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst, Ast} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    median: {
      translationKey: 'MEDIAN',
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
  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length === 0) {
      return new CellError(ErrorType.NA)
    }

    const values: number[] = []
    for (const scalarValue of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      if (scalarValue instanceof CellError) {
        return scalarValue
      } else if (typeof scalarValue === 'number') {
        values.push(scalarValue)
      }
    }
    
    if (values.length === 0) {
      return new CellError(ErrorType.NUM)
    }

    values.sort((a, b) => (a - b))

    if (values.length % 2 === 0) {
      return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
    } else {
      return values[Math.floor(values.length / 2)]
    }
  }
}
