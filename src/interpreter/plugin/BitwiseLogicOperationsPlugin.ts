/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class BitwiseLogicOperationsPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'BITAND': {
      method: 'bitand',
      parameters: { list: [
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
      ]}
    },
    'BITOR': {
      method: 'bitor',
      parameters: { list: [
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
      ]}
    },
    'BITXOR': {
      method: 'bitxor',
      parameters: { list: [
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
        { argumentType: ArgumentTypes.INTEGER, minValue: 0 },
      ]}
    },
  }

  public bitand(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BITAND'),
      (left: number, right: number) => left & right
    )
  }

  public bitor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BITOR'),
      (left: number, right: number) => left | right
    )
  }

  public bitxor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('BITXOR'),
      (left: number, right: number) => left ^ right
    )
  }
}
