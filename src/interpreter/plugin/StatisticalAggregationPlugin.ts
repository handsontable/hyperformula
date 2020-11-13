/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {
  erf,
  erfc,
} from './3rdparty/jstat/jstat'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class StatisticalPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'ERF': {
      method: 'erf',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
      ]
    },
  }

  public erfc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ERFC'), erfc)
  }

}

