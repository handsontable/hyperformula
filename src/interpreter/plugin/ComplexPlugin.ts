/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {coerceComplexToString} from '../ArithmeticHelper'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class ComplexPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'COMPLEX': {
      method: 'complex',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.STRING, defaultValue: 'i' },
      ],
    },
  }

  public complex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COMPLEX'),
      (re: number, im: number, unit: string) => {
        if(unit !== 'i' && unit !== 'j') {
          return new CellError(ErrorType.VALUE, ErrorMessage.ShouldBeIorJ)
        }
        return coerceComplexToString([re, im], unit)
      })
  }
}
