/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class SqrtPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'SQRT': {
      method: 'sqrt',
    },
  }

  public sqrt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (input: number) => {
      if (input < 0) {
        return new CellError(ErrorType.NUM)
      } else {
        return Math.sqrt(input)
      }
    })
  }
}
