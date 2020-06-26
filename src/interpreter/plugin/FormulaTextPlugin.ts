/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AstNodeType, ProcedureAst} from '../../parser'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {FunctionPlugin} from '../index'
import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {Maybe} from '../../Maybe'

export class FormulaTextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FORMULATEXT': {
      method: 'formulatext',
      doesNotNeedArgumentsToBeComputed: true,
      isDependentOnSheetStructureChange: true
    },
  }

  public formulatext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = ast.args[0]

    let cellReference: Maybe<SimpleCellAddress>

    if (arg.type === AstNodeType.CELL_REFERENCE) {
      cellReference = arg.reference.toSimpleCellAddress(formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF)
      }
    }

    if (cellReference === undefined) {
      const value = this.evaluateAst(arg, formulaAddress)
      if (value instanceof CellError) {
        return value
      }
      return new CellError(ErrorType.NA)
    }

    const formula = this.serialization.getCellFormula(cellReference)
    return formula || new CellError(ErrorType.NA)
  }
}