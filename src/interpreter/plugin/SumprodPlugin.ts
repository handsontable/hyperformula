/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class SumprodPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SumprodPlugin> {
  public static implementedFunctions = {
    'SUMPRODUCT': {
      method: 'sumproduct',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
      ],
      repeatLastArgs: 1,
    },
  }

  public sumproduct(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SUMPRODUCT'), (...args: SimpleRangeValue[]) => {
      const width = args[0].width()
      const height = args[0].height()
      for (const arg of args) {
        if (arg.width() !== width || arg.height() !== height) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
        }
      }

      let ret = 0
      const iterators = args.map(arg => arg.iterateValuesFromTopLeftCorner())
      for (let i = 0; i < width * height; i++) {
        let acc = 1
        for (const it of iterators) {
          const val = it.next().value
          if (val instanceof CellError) {
            return val
          }
          const coercedVal = this.coerceScalarToNumberOrError(val)
          if (isExtendedNumber(coercedVal)) {
            acc *= getRawValue(coercedVal)
          } else {
            acc = 0
          }
        }
        ret += acc
      }

      return ret
    })
  }
}

