/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class LogarithmPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    'LOG10': {
      method: 'log10',
    },
    'LOG': {
      method: 'log',
    },
    'LN': {
      method: 'ln',
    },
  }

  public log10(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log10(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }

  public log(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let coercedLogarithmicBase
    if (ast.args[1]) {
      const logarithmicBase = this.evaluateAst(ast.args[1], formulaAddress)
      if (logarithmicBase instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }
      coercedLogarithmicBase = this.coerceScalarToNumberOrError(logarithmicBase)
    } else {
      coercedLogarithmicBase = 10
    }

    const coercedArg = this.coerceScalarToNumberOrError(arg)
    if (coercedArg instanceof CellError) {
      return coercedArg
    } else if (coercedLogarithmicBase instanceof CellError) {
      return coercedLogarithmicBase
    } else {
      if (coercedArg > 0 && coercedLogarithmicBase > 0) {
        return (Math.log(coercedArg) / Math.log(coercedLogarithmicBase))
      } else {
        return new CellError(ErrorType.NUM)
      }
    }
  }

  public ln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg) => {
      if (arg > 0) {
        return Math.log(arg)
      } else {
        return new CellError(ErrorType.NUM)
      }
    })
  }
}
