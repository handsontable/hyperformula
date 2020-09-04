/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceToRange} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class SumprodPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'SUMPRODUCT': {
      method: 'sumproduct',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
  }

  public sumproduct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SUMPRODUCT'), (left: SimpleRangeValue, right: SimpleRangeValue) => {
      if (left.numberOfElements() !== right.numberOfElements()) {
        return new CellError(ErrorType.VALUE)
      }

      let result = 0

      const lit = left.iterateValuesFromTopLeftCorner()
      const rit = right.iterateValuesFromTopLeftCorner()
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
    })
  }
}

