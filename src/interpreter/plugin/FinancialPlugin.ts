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
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
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
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
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
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        ]
    },
    'FV': {
      method: 'fv',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
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
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, defaultValue: 2},
      ]
    },
    'DOLLARDE': {
      method: 'dollarde',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'DOLLARFR': {
      method: 'dollarfr',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'EFFECT': {
      method: 'effect',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'ISPMT': {
      method: 'ispmt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'NOMINAL': {
      method: 'nominal',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ]
    },
    'NPER': {
      method: 'nper',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ]
    },
    'PV': {
      method: 'pv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ]
    },
    'RATE': {
      method: 'rate',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0.1},
      ]
    },
    'RRI': {
      method: 'rri',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'SLN': {
      method: 'sln',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'SYD': {
      method: 'syd',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'TBILLEQ': {
      method: 'tbilleq',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'TBILLPRICE': {
      method: 'tbillprice',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ]
    },
    'TBILLYIELD': {
      method: 'tbillyield',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('CUMIPMT'),
      (rate: number, periods: number, value: number, start: number, end: number, type: number) => {
        if (start > end) {
          return new CellError(ErrorType.NUM)
        }
        let acc = 0
        for(let i = start; i <= end; i++) {
          acc += ipmtCore(rate, i, periods, value, 0, type)
        }
        return acc
      }
    )
  }

  public cumprinc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CUMPRINC'),
      (rate: number, periods: number, value: number, start: number, end: number, type: number) => {
        if (start > end) {
          return new CellError(ErrorType.NUM)
        }
        let acc = 0
        for(let i = start; i <= end; i++) {
          acc += ppmtCore(rate, i, periods, value, 0, type)
        }
        return acc
      }
    )
  }

  public db(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DB'),
      (cost: number, salvage: number, life: number, period: number, month: number) => {
        if ((month===12 && period > life) || (period > life+1)) {
          return new CellError(ErrorType.NUM)
        }

        if (salvage >= cost) {
          return 0
        }

        const rate = Math.round((1 - Math.pow(salvage / cost, 1 / life))*1000)/1000

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
    )
  }

  public ddb(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DDB'),
      (cost: number, salvage: number, life: number, period: number, factor: number) => {
        if (period > life) {
          return new CellError(ErrorType.NUM)
        }
        let rate = factor / life
        let oldValue
        if(rate >= 1) {
          rate = 1
          if(period === 1) {
            oldValue = cost
          } else {
            oldValue = 0
          }
        } else {
          oldValue = cost * Math.pow(1 - rate, period - 1)
        }
        const newValue = cost * Math.pow(1-rate, period)
        return Math.max(oldValue - Math.max(salvage, newValue), 0)
      }
    )
  }

  public dollarde(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DOLLARDE'),
      (dollar, fraction) => {
        if (fraction < 1) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        fraction = Math.trunc(fraction)

        while(fraction>10) {
          fraction /= 10
        }
        return Math.trunc(dollar) + (dollar-Math.trunc(dollar))*10/fraction
      }
    )
  }

  public dollarfr(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DOLLARFR'),
      (dollar, fraction) => {
        if (fraction < 1) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        fraction = Math.trunc(fraction)

        while(fraction>10) {
          fraction /= 10
        }
        return Math.trunc(dollar) + (dollar-Math.trunc(dollar))*fraction/10
      }
    )
  }

  public effect(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EFFECT'),
      (rate: number, periods: number) => {
        periods = Math.trunc(periods)
        return Math.pow(1 + rate / periods, periods) - 1
      }
    )
  }

  public ispmt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ISPMT'),
      (rate, period, periods, value) => {
        if(periods===0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return value * rate * (period / periods - 1)
      }
    )
  }

  public nominal(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('NOMINAL'),
      (rate: number, periods: number) => {
        periods = Math.trunc(periods)
        return (Math.pow(rate + 1, 1 / periods) - 1) * periods
      }
    )
  }

  public nper(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('NPER'),
      (rate, payment, present, future, type) => {
        if(rate === 0) {
          if(payment === 0) {
            return new CellError(ErrorType.DIV_BY_ZERO)
          }
          return (-present - future)/payment
        }
        if(type) {
          payment *= 1 + rate
        }
        return Math.log( (payment  - future * rate) / (present * rate + payment)) / Math.log(1 + rate)
      }
    )
  }

  public rate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('RATE'),
      (periods, payment, present, future, type, guess) => {
        if(guess<=-1) {
          return new CellError(ErrorType.VALUE)
        }

        const epsMax = 1e-10

        const iterMax = 20

        let rate = guess
        type = type ? 1 : 0
        for(let i=0; i<iterMax; i++) {
          if(rate<=-1) {
            return new CellError(ErrorType.NUM)
          }
          let y
          if (Math.abs(rate) < epsMax) {
            y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future
          } else {
            const f = Math.pow(1+rate, periods)
            y = present * f + payment * (1 / rate + type) * (f - 1) + future
          }
          if(Math.abs(y) < epsMax) {
            return rate
          }
          let dy
          if (Math.abs(rate) < epsMax) {
            dy = present * periods + payment * type * periods
          } else {
            const f = Math.pow(1+rate, periods)
            const df = periods * Math.pow(1+rate, periods - 1)
            dy = present *  df + payment * (1/rate + type) * df + payment * (-1/(rate*rate)) * (f-1)
          }
          rate -= y/dy
        }
        return new CellError(ErrorType.NUM)
      }
    )
  }

  public pv(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('PV'),
      (rate, periods, payment, future, type) => {
        type = type ? 1 : 0
        if(rate === -1) {
          if(periods === 0) {
            return new CellError(ErrorType.NUM)
          } else {
            return new CellError(ErrorType.DIV_BY_ZERO)
          }
        }
        if (rate === 0) {
          return -payment * periods - future
        } else {
          return ((1 - Math.pow(1 + rate, periods)) * payment * (1 + rate * type) / rate - future) / Math.pow(1 + rate, periods)
        }
      }
    )
  }

  public rri(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('RRI'),
      (periods, present, future) => {
        if (present === 0 || (future < 0 && present > 0) || (future > 0 && present < 0)) {
          return new CellError(ErrorType.NUM)
        }

        return Math.pow(future / present, 1 / periods) - 1
      }
    )
  }

  public sln(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SLN'),
      (cost, salvage, life) => {
        if (life === 0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return (cost - salvage) / life
      }
    )
  }

  public syd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SYD'),
      (cost, salvage, life, period) => {
        if (period > life) {
          return new CellError(ErrorType.NUM)
        }
        return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1))
      }
    )
  }

  public tbilleq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TBILLEQ'),
      (settlement, maturity, discount) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.interpreter.dateHelper.numberToSimpleDate(settlement)
        const endDate = this.interpreter.dateHelper.numberToSimpleDate(maturity)
        if(endDate.year > startDate.year+1 || (endDate.year === startDate.year+1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        const denom = 360 - discount * (maturity - settlement)
        if(denom === 0) {
          return 0
        }
        if(denom < 0) {
          return new CellError(ErrorType.NUM)
        }
        return 365 * discount/denom
      }
    )
  }

  public tbillprice(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TBILLPRICE'),
      (settlement, maturity, discount) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.interpreter.dateHelper.numberToSimpleDate(settlement)
        const endDate = this.interpreter.dateHelper.numberToSimpleDate(maturity)
        if(endDate.year > startDate.year+1 || (endDate.year === startDate.year+1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        const denom = 360 - discount * (maturity - settlement)
        if(denom === 0) {
          return 0
        }
        if(denom < 0) {
          return new CellError(ErrorType.NUM)
        }
        return 100 * (1 - discount * (maturity - settlement) / 360)
      }
    )
  }

  public tbillyield(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TBILLYIELD'),
      (settlement, maturity, price) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.interpreter.dateHelper.numberToSimpleDate(settlement)
        const endDate = this.interpreter.dateHelper.numberToSimpleDate(maturity)
        if(endDate.year > startDate.year+1 || (endDate.year === startDate.year+1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        return (100 - price) * 360 / (price * (maturity - settlement))
      }
    )
  }
}

function pmtCore(rate: number, periods: number, present: number, future: number, type: number): number {
  if (rate === 0) {
    return (-present - future) / periods
  } else {
    const term = Math.pow(1 + rate, periods)
    return (future * rate + present * rate * term) * (type ? 1 / (1 + rate) : 1) / (1 - term)
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
