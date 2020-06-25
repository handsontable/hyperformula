/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DegreesPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DEGREES': {
      method: 'degrees',
    },
  }

  public degrees(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return arg * (180 / Math.PI)
    })
  }
}
