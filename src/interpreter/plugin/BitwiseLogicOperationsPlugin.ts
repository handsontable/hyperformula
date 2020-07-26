/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class BitwiseLogicOperationsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'BITAND': {
      method: 'bitand',
      parameters: [
        { argumentType: 'integer', minValue: 0 },
        { argumentType: 'integer', minValue: 0 },
      ]
    },
    'BITOR': {
      method: 'bitor',
      parameters: [
        { argumentType: 'integer', minValue: 0 },
        { argumentType: 'integer', minValue: 0 },
      ]
    },
    'BITXOR': {
      method: 'bitxor',
      parameters: [
        { argumentType: 'integer', minValue: 0 },
        { argumentType: 'integer', minValue: 0 },
      ]
    },
  }

  public bitand(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, BitwiseLogicOperationsPlugin.implementedFunctions.BITAND, (left: number, right: number) => {
      return left & right
    })
  }

  public bitor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, BitwiseLogicOperationsPlugin.implementedFunctions.BITOR, (left: number, right: number) => {
      return left | right
    })
  }

  public bitxor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, BitwiseLogicOperationsPlugin.implementedFunctions.BITXOR, (left: number, right: number) => {
      return left ^ right
    })
  }
}
