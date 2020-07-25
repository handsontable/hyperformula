/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DELTA': {
      method: 'delta',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
  }

  public delta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, DeltaPlugin.implementedFunctions.DELTA, (left: number, right: number) => {
      return left === right ? 1 : 0
    })
  }
}
