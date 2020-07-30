/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class IsEvenPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISEVEN': {
      method: 'iseven',
      parameters: { list: [
        { argumentType: ArgumentTypes.NUMBER}
      ]}
    },
  }

  public iseven(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISEVEN'),
      (val) => (val % 2 === 0)
    )
  }
}
