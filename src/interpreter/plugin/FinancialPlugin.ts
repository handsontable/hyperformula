/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class FinancialPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'PMT': {
      method: 'pmt',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
          {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1, defaultValue: 0},
        ]
    },
    'IPMT': {
      method: 'ipmt',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
          {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1, defaultValue: 0},
        ]
    },
    'PPMT': {
      method: 'ppmt',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
          {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1, defaultValue: 0},
        ]
    },
    'FV': {
      method: 'fv',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
          {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1, defaultValue: 0},
        ]
    },
    'CUMIPMT': {
      method: 'cumipmt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1},
      ]
    },
    'CUMPRINC': {
      method: 'cumprinc',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0, maxValue: 1},
      ]
    },
    'DB': {
      method: 'db',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1, maxValue: 12, defaultValue: 12},
      ]
    },
    'DDB': {
      method: 'ddb',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, defaultValue: 2},
      ]
    },
  }

  public pmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('PMT'), pmtCore)
  }

  public ipmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('IPMT'), ipmtCore)
  }

  public ppmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('PPMT'), ppmtCore)
  }

  public fv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FV'), fvCore)
  }

  public cumipmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CUMIPMT'), cumipmtCore)
  }

  public cumprinc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CUMPRINC'), cumprincCore)
  }

  public db(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DB'), dbCore)
  }

  public ddb(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DDB'), ddbCore)
  }
}

function pmtCore(rate: number, periods: number, present: number, future: number, type: number): number {
  if (rate === 0) {
    return (-present - future) / periods
  } else {
    const term = Math.pow(1 + rate, periods)
    return (future * rate + present * rate * term) * (type !== 0 ? 1 / (1 + rate) : 1) / (1 - term)
  }
}

function ipmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  const payment = pmtCore(rate, periods, present, future, type)
  if (period === 1) {
    return rate * (type ? 0 : -present)
  } else {
    return rate * (type ? fvCore(rate, period - 2, payment, present, type) - payment : fvCore(rate, period - 1, payment, present, type))
  }
}

function fvCore(rate: number, periods: number, payment: number, value: number, type: number): number {
  if (rate === 0) {
    return -value - payment * periods
  } else {
    const term = Math.pow(1 + rate, periods)
    return payment * (type ? (1 + rate) : 1) * (1 - term) / rate - value * term
  }
}

function ppmtCore(rate: number, period: number, periods: number, present: number, future: number, type: number): number {
  return pmtCore(rate, periods, present, future, type) - ipmtCore(rate, period, periods, present, future, type)
}

function cumipmtCore(rate: number, periods: number, value: number, start: number, end: number, type: number): number | CellError {
  if (start > end) {
    return new CellError(ErrorType.NUM)
  }

  const payment = pmtCore(rate, periods, value, 0, type)
  let acc = 0

  if (start === 1) {
    if (type === 0) {
      acc = -value
    }
    start = 2
  }

  for (let i = start; i <= end; i++) {
    acc += type ? fvCore(rate, i - 2, payment, value, type) - payment : fvCore(rate, i - 1, payment, value, type)
  }
  return acc * rate
}

function cumprincCore(rate: number, periods: number, value: number, start: number, end: number, type: number): number | CellError {
  if (start > end) {
    return new CellError(ErrorType.NUM)
  }

  const payment = pmtCore(rate, periods, value, 0, type)
  let acc = 0
  if (start === 1) {
    acc = type ? payment : payment + value*rate
    start = 2
  }
  for (let i = start; i <= end; i++) {
    acc += payment - rate * (type?  (fvCore(rate, i - 2, payment, value, 1) - payment) : fvCore(rate, i - 1, payment, value, 0))
  }

  return acc
}

function dbCore(cost: number, salvage: number, life: number, period: number, month: number): number | CellError {
  if ((month===12 && period > life) || (period > life+1)) {
    return new CellError(ErrorType.NUM)
  }

  if (salvage >= cost) {
    return 0
  }

  let rate = Math.round((1 - Math.pow(salvage / cost, 1 / life))*1000)/1000

  const initial = cost * rate * month / 12

  if(period===1) {
    return initial
  }

  let total = initial

  for (let i = 0; i < period - 2; i++) {
    total += (cost - total) * rate
  }
  if(period === life+1) {
    return (cost - total) * rate * (12-month)/12
  }
  return (cost - total) * rate
}

function ddbCore(cost: number, salvage: number, life: number, period: number, factor: number): number | CellError {
  if (period > life) {
    return new CellError(ErrorType.NUM)
  }
  if (salvage >= cost) {
    return 0
  }

  let total = 0;
  for (let i = 0; i < period-1; i++) {
    total += Math.min((cost - total) * (factor / life), (cost - salvage - total))
  }

  return Math.min((cost - total) * (factor / life), (cost - salvage - total))
}
