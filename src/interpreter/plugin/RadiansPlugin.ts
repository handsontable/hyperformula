/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class RadiansPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'RADIANS': {
      method: 'radians',
    },
  }

  public radians(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      return arg * (Math.PI / 180)
    })
  }
}
