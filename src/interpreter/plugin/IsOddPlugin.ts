/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISODD': {
      method: 'isodd',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER}
        ]
    },
  }

  public isodd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ISODD'),
      (val) => (val % 2 === 1)
    )
  }
}
