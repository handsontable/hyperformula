/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'LOG10': {
      method: 'log10',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'LOG': {
      method: 'log',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 10 },
      ],
    },
    'LN': {
      method: 'ln',
      parameters: [
        { argumentType: 'number' }
      ],
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, LogarithmPlugin.implementedFunctions.LOG10, Math.log10)
  }

  public log(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, LogarithmPlugin.implementedFunctions.LOG, (arg: number, base: number) => {
        if(arg > 0 && base > 0) {
          return Math.log(arg) / Math.log(base)
        } else {
          return new CellError(ErrorType.NUM)
        }
      })
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, LogarithmPlugin.implementedFunctions.LN, Math.log)
  }
}
