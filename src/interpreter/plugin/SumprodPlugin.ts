/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceToRange} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class SumprodPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'SUMPRODUCT': {
      method: 'sumprod',
    },
  }

  public sumprod(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const [left, right] = ast.args

    const leftArgValue = coerceToRange(this.evaluateAst(left, formulaAddress))
    const rightArgValue = coerceToRange(this.evaluateAst(right, formulaAddress))

    if (leftArgValue.numberOfElements() !== rightArgValue.numberOfElements()) {
      return new CellError(ErrorType.VALUE)
    }

    return this.reduceSumprod(leftArgValue, rightArgValue)
  }

  private reduceSumprod(left: SimpleRangeValue, right: SimpleRangeValue): number | CellError {
    let result = 0

    const lit = left.valuesFromTopLeftCorner()
    const rit = right.valuesFromTopLeftCorner()
    let l, r

    while (l = lit.next(), r = rit.next(), !l.done && !r.done) {
      if (l.value instanceof CellError) {
        return l.value
      } else if (r.value instanceof CellError) {
        return r.value
      } else {
        const lval = this.coerceScalarToNumberOrError(l.value)
        const rval = this.coerceScalarToNumberOrError(r.value)
        if (typeof lval === 'number' && typeof rval === 'number') {
          result += lval * rval
        }
      }
    }

    return result
  }
}

