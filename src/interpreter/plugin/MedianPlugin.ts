/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InternalScalarValue, RawScalarValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'MEDIAN': {
      method: 'median',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR},
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'LARGE': {
      method: 'large',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
    },
    'SMALL': {
      method: 'small',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
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
  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MEDIAN'), (...args: RawScalarValue[]) => {
      const values: number[] = (args.filter((val: RawScalarValue) => (typeof val === 'number')) as number[])
      ast.args.forEach((arg) => { //ugly but works
        if (arg.type === AstNodeType.EMPTY) {
          values.push(0)
        }
      })
      if (values.length === 0) {
        return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
      }
      values.sort((a, b) => (a - b))
      if (values.length % 2 === 0) {
        return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
      } else {
        return values[Math.floor(values.length / 2)]
      }
    })
  }

  public large(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LARGE'),
      (range: SimpleRangeValue, n: number) => {
        const vals = this.interpreter.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if(vals instanceof CellError) {
          return vals
        }
        vals.sort((a, b) => a-b)
        n = Math.trunc(n)
        if(n > vals.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return vals[vals.length-n]
      }
    )
  }

  public small(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SMALL'),
      (range: SimpleRangeValue, n: number) => {
        const vals = this.interpreter.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if(vals instanceof CellError) {
          return vals
        }
        vals.sort((a, b) => a-b)
        n = Math.trunc(n)
        if(n > vals.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return vals[n-1]
      }
    )
  }
}
