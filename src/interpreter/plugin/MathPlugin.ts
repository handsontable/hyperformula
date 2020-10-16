/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class MathPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FACT': {
      method: 'fact',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 171}
      ]
    },
    'FACTDOUBLE': {
      method: 'factdouble',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0, lessThan: 289}
      ]
    },
  }

  public fact(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FACT'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for(let i=1; i<=arg; i++) {
          ret *= i
        }
        return ret
      }
    )
  }

  public factdouble(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FACTDOUBLE'),
      (arg: number) => {
        arg = Math.trunc(arg)
        let ret = 1
        for(let i=arg; i>=1; i-=2) {
          ret *= i
        }
        return ret
      }
    )
  }
}
