/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class IsOddPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    isodd: {
      translationKey: 'ISODD',
    },
  }

  public isodd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedValue = this.coerceScalarToNumberOrError(arg)
    if (coercedValue instanceof CellError) {
      return coercedValue
    } else {
      return (coercedValue % 2 === 1)
    }
  }
}
