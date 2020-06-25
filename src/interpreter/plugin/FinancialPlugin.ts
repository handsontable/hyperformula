/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class FinancialPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'PMT': {
      method: 'pmt',
    },
    'IPMT': {
      method: 'ipmt',
    },
    'PPMT': {
      method: 'ppmt',
    },
    'FV': {
      method: 'fv',
    },
  }

  private template5(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg1: number, arg2: number, arg3: number, arg4: number, arg5: number) => number): InternalScalarValue {
    if (ast.args.length < 3 || ast.args.length > 5) {
      return new CellError(ErrorType.NA)
    }

    if(ast.args[0].type === AstNodeType.EMPTY || ast.args[1].type === AstNodeType.EMPTY || ast.args[2].type === AstNodeType.EMPTY) {
      return new CellError(ErrorType.NUM)
    }

    let arg1 = this.evaluateAst(ast.args[0], formulaAddress)
    if(arg1 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg2 = this.evaluateAst(ast.args[1], formulaAddress)
    if(arg2 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg3 = this.evaluateAst(ast.args[2], formulaAddress)
    if(arg3 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg4, arg5
    if(ast.args.length < 4 || ast.args[3].type === AstNodeType.EMPTY) {
      arg4 = 0
    } else {
      arg4 = this.evaluateAst(ast.args[3], formulaAddress)
    }

    if(arg4 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    if(ast.args.length < 5 || ast.args[4].type === AstNodeType.EMPTY) {
      arg5 = 0
    } else {
      arg5 = this.evaluateAst(ast.args[4], formulaAddress)
    }

    if(arg5 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }


    arg1 = this.coerceScalarToNumberOrError(arg1)
    if(arg1 instanceof CellError) {
      return arg1
    }

    arg2 = this.coerceScalarToNumberOrError(arg2)
    if(arg2 instanceof CellError) {
      return arg2
    }

    arg3 = this.coerceScalarToNumberOrError(arg3)
    if(arg3 instanceof CellError) {
      return arg3
    }

    arg4 = this.coerceScalarToNumberOrError(arg4)
    if(arg4 instanceof CellError) {
      return arg4
    }

    arg5 = this.coerceScalarToNumberOrError(arg5)
    if(arg5 instanceof CellError) {
      return arg5
    }

    return fn(arg1, arg2, arg3, arg4, arg5)
  }

  private template6(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg1: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number) => number): InternalScalarValue {
    if (ast.args.length < 4 || ast.args.length > 6) {
      return new CellError(ErrorType.NA)
    }

    if(ast.args[0].type === AstNodeType.EMPTY || ast.args[1].type === AstNodeType.EMPTY || ast.args[2].type === AstNodeType.EMPTY || ast.args[3].type === AstNodeType.EMPTY) {
      return new CellError(ErrorType.NUM)
    }

    let arg1 = this.evaluateAst(ast.args[0], formulaAddress)
    if(arg1 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg2 = this.evaluateAst(ast.args[1], formulaAddress)
    if(arg2 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg3 = this.evaluateAst(ast.args[2], formulaAddress)
    if(arg3 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg4 = this.evaluateAst(ast.args[3], formulaAddress)
    if(arg4 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    let arg5, arg6
    if(ast.args.length < 5 || ast.args[4].type === AstNodeType.EMPTY) {
      arg5 = 0
    } else {
      arg5 = this.evaluateAst(ast.args[4], formulaAddress)
    }

    if(arg5 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    if(ast.args.length < 6 || ast.args[5].type === AstNodeType.EMPTY) {
      arg6 = 0
    } else {
      arg6 = this.evaluateAst(ast.args[5], formulaAddress)
    }

    if(arg6 instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }


    arg1 = this.coerceScalarToNumberOrError(arg1)
    if(arg1 instanceof CellError) {
      return arg1
    }

    arg2 = this.coerceScalarToNumberOrError(arg2)
    if(arg2 instanceof CellError) {
      return arg2
    }

    arg3 = this.coerceScalarToNumberOrError(arg3)
    if(arg3 instanceof CellError) {
      return arg3
    }

    arg4 = this.coerceScalarToNumberOrError(arg4)
    if(arg4 instanceof CellError) {
      return arg4
    }

    arg5 = this.coerceScalarToNumberOrError(arg5)
    if(arg5 instanceof CellError) {
      return arg5
    }

    arg6 = this.coerceScalarToNumberOrError(arg6)
    if(arg6 instanceof CellError) {
      return arg6
    }

    return fn(arg1, arg2, arg3, arg4, arg5, arg6)
  }

  public pmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.template5(ast, formulaAddress, pmtCore)
  }

  public ipmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.template6(ast, formulaAddress, ipmtCore)
  }

  public ppmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.template6(ast, formulaAddress, ppmtCore)
  }

  public fv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.template5(ast, formulaAddress, fvCore)
  }
}

function pmtCore(rate: number, periods: number, present: number, future: number, type: number): number {
  let result
  if (rate === 0) {
    result = (present + future) / periods
  } else {
    const term = Math.pow(1 + rate, periods)
    if (type !== 0) {
      result = (future * rate / (term - 1) + present * rate / (1 - 1 / term)) / (1 + rate)
    } else {
      result = future * rate / (term - 1) + present * rate / (1 - 1 / term)
    }
  }
  return -result
}

function ipmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  const payment = pmtCore(rate, periods, present, future, type)
  let interest
  if (period === 1) {
    if (type === 1) {
      interest = 0
    } else {
      interest = -present
    }
  } else {
    if (type === 1) {
      interest = fvCore(rate, period - 2, payment, present, 1) - payment
    } else {
      interest = fvCore(rate, period - 1, payment, present, 0)
    }
  }
  return interest * rate
}

function fvCore(rate: number, periods: number, payment: number, value: number, type: number): number {
  let result
  if (rate === 0) {
    result = value + payment * periods
  } else {
    const term = Math.pow(1 + rate, periods)
    if (type === 1) {
      result = value * term + payment * (1 + rate) * (term - 1) / rate
    } else {
      result = value * term + payment * (term - 1) / rate
    }
  }
  return -result
}

function ppmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  return pmtCore(rate, periods, present, future, type) - ipmtCore(rate, period, periods, present, future, type)
}
