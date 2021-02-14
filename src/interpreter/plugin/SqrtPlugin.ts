/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class SqrtPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'SQRT': {
      method: 'sqrt',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
  }

  public sqrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SQRT'), Math.sqrt)
  }
}
