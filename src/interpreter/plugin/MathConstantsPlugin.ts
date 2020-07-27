/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

const PI = parseFloat(Math.PI.toFixed(14))
const E = parseFloat(Math.E.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'PI': {
      method: 'pi',
      parameters: {list: []},
    },
    'E': {
      method: 'e',
      parameters: {list: []},
    },
  }

  public pi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('PI'),
      () => PI
    )
  }

  public e(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('E'),
      () => E
    )
  }
}
