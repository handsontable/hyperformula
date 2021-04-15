/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {getRawValue, InternalScalarValue, isExtendedNumber} from '../InterpreterValue'
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
          const lval = this.coerceScalarToNumberOrError(l.value)
          const rval = this.coerceScalarToNumberOrError(r.value)
          if (isExtendedNumber(lval) && isExtendedNumber(rval)) {
            result += getRawValue(lval) * getRawValue(rval)
          }
        }
      }

      return result
    })
  }
}

