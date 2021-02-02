/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class AbsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ABS': {
      method: 'abs',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ]
    },
  }

  public abs(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ABS'), Math.abs)
  }
}
