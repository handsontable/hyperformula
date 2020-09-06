/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {FunctionPlugin} from '../index'
import {ArgumentTypes} from './FunctionPlugin'

export class FormulaTextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'FORMULATEXT': {
      method: 'formulatext',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR}
      ],
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
   */
  public formulatext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithReferenceArgument(ast.args, formulaAddress, this.metadata('FORMULATEXT'),
      () => new CellError(ErrorType.NA, 'At least one argument required.'),
      (cellReference: SimpleCellAddress) => this.serialization.getCellFormula(cellReference) ?? new CellError(ErrorType.NA, 'Expected formula.'),
      () => new CellError(ErrorType.NA, 'Cell reference required.')
    )
  }
}
