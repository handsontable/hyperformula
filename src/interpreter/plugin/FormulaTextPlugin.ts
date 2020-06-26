/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AstNodeType, ProcedureAst} from '../../parser'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {FunctionPlugin} from '../index'

export class FormulaTextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FORMULATEXT': {
      method: 'formulatext',
    },
  }

  public formulatext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = ast.args[0]

    if (arg.type !== AstNodeType.CELL_REFERENCE) {
      const value = this.evaluateAst(arg, formulaAddress)
      if (value instanceof CellError) {
        return value
      }
      return new CellError(ErrorType.NA)
    }

    const cellReference = arg.reference.toSimpleCellAddress(formulaAddress)
    const formula = this.serialization.getCellFormula(cellReference)

    return formula || new CellError(ErrorType.NA)
  }
}