/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {FunctionPlugin} from '../index'

export class FormulaTextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FORMULATEXT': {
      method: 'formulatext',
      parameters: {
        list: [
          {argumentType: 'noerror'}
        ]
      },
      doesNotNeedArgumentsToBeComputed: true,
      isDependentOnSheetStructureChange: true
    },
  }

  /**
   * Corresponds to FORMULATEXT(value)
   *
   * Returns a formula in a given cell as a string.
   *
   * @param ast
   * @param formulaAddress
   * */
  public formulatext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithReferenceArgument(ast.args, formulaAddress, this.parameters('FORMULATEXT'),
      () => new CellError(ErrorType.NA),
      (cellReference: SimpleCellAddress) => this.serialization.getCellFormula(cellReference) || new CellError(ErrorType.NA),
      () => new CellError(ErrorType.NA)
    )
  }
}