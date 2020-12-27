/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {RichNumber, InternalScalarValue, putRawValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
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
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
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
          const lval = this.coerceScalarToNumberOrError(putRawValue(l.value))
          const rval = this.coerceScalarToNumberOrError(putRawValue(r.value))
          if (lval instanceof RichNumber && rval instanceof RichNumber) {
            result += lval.get() * rval.get()
          }
        }
      }

      return result
    })
  }
}

