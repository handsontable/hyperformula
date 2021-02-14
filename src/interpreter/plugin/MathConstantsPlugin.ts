/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export const PI = parseFloat(Math.PI.toFixed(14))

export class MathConstantsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'PI': {
      method: 'pi',
      parameters: [],
    },
    'SQRTPI': {
      method: 'sqrtpi',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0}
      ],
    },
  }

  public pi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('PI'),
      () => PI
    )
  }

  public sqrtpi(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SQRTPI'),
      (arg: number) => Math.sqrt(PI*arg)
    )
  }
}
