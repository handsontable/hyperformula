/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class DeltaPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    delta: {
      translationKey: 'DELTA',
    },
  }

  public delta(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const left = this.getNumericArgument(ast, formulaAddress, 0)
    if (left instanceof CellError) {
      return left
    }

    let right: number | CellError = 0
    if (ast.args.length === 2) {
      right = this.getNumericArgument(ast, formulaAddress, 1)
      if (right instanceof CellError) {
        return right
      }
    }

    return left === right ? 1 : 0
  }
}
