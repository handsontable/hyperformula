/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class IsEvenPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISEVEN': {
      method: 'iseven',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER}
      ]
    },
  }

  public iseven(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ISEVEN'),
      (val) => (val % 2 === 0)
    )
  }
}
