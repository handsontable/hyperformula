/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {EmptyValue, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class CountBlankPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'COUNTBLANK': {
      method: 'countblank',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
  }

  public countblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COUNTBLANK'), (...args: InternalScalarValue[]) => {
      let counter = 0
      args.forEach((arg) => {
        if(arg === EmptyValue) {
          counter++
        }
      })
      return counter
    })
  }
}
