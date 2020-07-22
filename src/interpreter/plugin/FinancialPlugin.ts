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
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
    'IPMT': {
      method: 'ipmt',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
    'PPMT': {
      method: 'ppmt',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
    'FV': {
      method: 'fv',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0 },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
  }

  public pmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, FinancialPlugin.implementedFunctions.PMT.parameters, pmtCore)
  }

  public ipmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, FinancialPlugin.implementedFunctions.IPMT.parameters, ipmtCore)
  }

  public ppmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, FinancialPlugin.implementedFunctions.PPMT.parameters, ppmtCore)
  }

  public fv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, FinancialPlugin.implementedFunctions.FV.parameters, fvCore)
  }
}

function pmtCore(rate: number, periods: number, present: number, future: number, type: number): number {
  if (rate === 0) {
    return (- present - future) / periods
  } else {
    const term = Math.pow(1 + rate, periods)
    return (future * rate + present * rate * term) * (type !== 0 ? 1 / (1 + rate) : 1) / (1-term)
  }
}

function ipmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  const payment = pmtCore(rate, periods, present, future, type)
  if (period === 1) {
    return rate * (type !== 0 ? 0 : -present)
  } else {
    return rate * (type !== 0 ? fvCore(rate, period - 2, payment, present, type) - payment : fvCore(rate, period - 1, payment, present, type))
  }
}

function fvCore(rate: number, periods: number, payment: number, value: number, type: number): number {
  if (rate === 0) {
    return - value - payment * periods
  } else {
    const term = Math.pow(1 + rate, periods)
    return payment * (type !== 0 ? (1 + rate) : 1) * (1 - term) / rate  - value * term
  }
}

function ppmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  return pmtCore(rate, periods, present, future, type) - ipmtCore(rate, period, periods, present, future, type)
}
