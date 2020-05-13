/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class CodePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CODE': {
      method: 'code',
    },
  }

  public code(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToStringArgument(ast, formulaAddress, (value: string) => {
      if (value.length === 0) {
        return new CellError(ErrorType.VALUE)
      }
      return value.charCodeAt(0)
    })
  }
}
