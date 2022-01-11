/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {
  EmptyValue,
  getRawValue,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
  RawInterpreterValue
} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class FinancialPlugin extends FunctionPlugin implements FunctionPluginTypecheck<FinancialPlugin> {
  public static implementedFunctions = {
    'PMT': {
      method: 'pmt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
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
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
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
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'FV': {
      method: 'fv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
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
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
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
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DB': {
      method: 'db',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 1, maxValue: 12, defaultValue: 12},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DDB': {
      method: 'ddb',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0, defaultValue: 2},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DOLLARDE': {
      method: 'dollarde',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ],
    },
    'DOLLARFR': {
      method: 'dollarfr',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ],
    },
    'EFFECT': {
      method: 'effect',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'ISPMT': {
      method: 'ispmt',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
    },
    'NOMINAL': {
      method: 'nominal',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'NPER': {
      method: 'nper',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
    },
    'PV': {
      method: 'pv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
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
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'RRI': {
      method: 'rri',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'SLN': {
      method: 'sln',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'SYD': {
      method: 'syd',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'TBILLEQ': {
      method: 'tbilleq',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'TBILLPRICE': {
      method: 'tbillprice',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'TBILLYIELD': {
      method: 'tbillyield',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'FVSCHEDULE': {
      method: 'fvschedule',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.RANGE},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'NPV': {
      method: 'npv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1,
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'MIRR': {
      method: 'mirr',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'PDURATION': {
      method: 'pduration',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
        {argumentType: ArgumentTypes.NUMBER, greaterThan: 0},
      ],
    },
    'XNPV': {
      method: 'xnpv',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, greaterThan: -1},
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
  }

  public pmt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PMT'), pmtCore)
  }

  public ipmt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IPMT'), ipmtCore)
  }

  public ppmt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PPMT'), ppmtCore)
  }

  public fv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FV'), fvCore)
  }

  public cumipmt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CUMIPMT'),
      (rate: number, periods: number, value: number, start: number, end: number, type: number) => {
        if (start > end) {
          return new CellError(ErrorType.NUM, ErrorMessage.EndStartPeriod)
        }
        let acc = 0
        for (let i = start; i <= end; i++) {
          acc += ipmtCore(rate, i, periods, value, 0, type)
        }
        return acc
      }
    )
  }

  public cumprinc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CUMPRINC'),
      (rate: number, periods: number, value: number, start: number, end: number, type: number) => {
        if (start > end) {
          return new CellError(ErrorType.NUM, ErrorMessage.EndStartPeriod)
        }
        let acc = 0
        for (let i = start; i <= end; i++) {
          acc += ppmtCore(rate, i, periods, value, 0, type)
        }
        return acc
      }
    )
  }

  public db(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DB'),
      (cost: number, salvage: number, life: number, period: number, month: number) => {
        if ((month === 12 && period > life) || (period > life + 1)) {
          return new CellError(ErrorType.NUM, ErrorMessage.PeriodLong)
        }

        if (salvage >= cost) {
          return 0
        }

        const rate = Math.round((1 - Math.pow(salvage / cost, 1 / life)) * 1000) / 1000

        const initial = cost * rate * month / 12

        if (period === 1) {
          return initial
        }

        let total = initial

        for (let i = 0; i < period - 2; i++) {
          total += (cost - total) * rate
        }
        if (period === life + 1) {
          return (cost - total) * rate * (12 - month) / 12
        }
        return (cost - total) * rate
      }
    )
  }

  public ddb(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DDB'),
      (cost: number, salvage: number, life: number, period: number, factor: number) => {
        if (period > life) {
          return new CellError(ErrorType.NUM)
        }
        let rate = factor / life
        let oldValue
        if (rate >= 1) {
          rate = 1
          if (period === 1) {
            oldValue = cost
          } else {
            oldValue = 0
          }
        } else {
          oldValue = cost * Math.pow(1 - rate, period - 1)
        }
        const newValue = cost * Math.pow(1 - rate, period)
        return Math.max(oldValue - Math.max(salvage, newValue), 0)
      }
    )
  }

  public dollarde(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DOLLARDE'),
      (dollar, fraction) => {
        if (fraction < 1) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        fraction = Math.trunc(fraction)

        while (fraction > 10) {
          fraction /= 10
        }
        return Math.trunc(dollar) + (dollar - Math.trunc(dollar)) * 10 / fraction
      }
    )
  }

  public dollarfr(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DOLLARFR'),
      (dollar, fraction) => {
        if (fraction < 1) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        fraction = Math.trunc(fraction)

        while (fraction > 10) {
          fraction /= 10
        }
        return Math.trunc(dollar) + (dollar - Math.trunc(dollar)) * fraction / 10
      }
    )
  }

  public effect(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EFFECT'),
      (rate: number, periods: number) => {
        periods = Math.trunc(periods)
        return Math.pow(1 + rate / periods, periods) - 1
      }
    )
  }

  public ispmt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISPMT'),
      (rate, period, periods, value) => {
        if (periods === 0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return value * rate * (period / periods - 1)
      }
    )
  }

  public nominal(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NOMINAL'),
      (rate: number, periods: number) => {
        periods = Math.trunc(periods)
        return (Math.pow(rate + 1, 1 / periods) - 1) * periods
      }
    )
  }

  public nper(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NPER'),
      (rate, payment, present, future, type) => {
        if (rate === 0) {
          if (payment === 0) {
            return new CellError(ErrorType.DIV_BY_ZERO)
          }
          return (-present - future) / payment
        }
        if (type) {
          payment *= 1 + rate
        }
        return Math.log((payment - future * rate) / (present * rate + payment)) / Math.log(1 + rate)
      }
    )
  }

  public rate(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RATE'),
      (periods, payment, present, future, type, guess) => {
        if (guess <= -1) {
          return new CellError(ErrorType.VALUE)
        }

        const epsMax = 1e-10

        const iterMax = 20

        let rate = guess
        type = type ? 1 : 0
        for (let i = 0; i < iterMax; i++) {
          if (rate <= -1) {
            return new CellError(ErrorType.NUM)
          }
          let y
          if (Math.abs(rate) < epsMax) {
            y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future
          } else {
            const f = Math.pow(1 + rate, periods)
            y = present * f + payment * (1 / rate + type) * (f - 1) + future
          }
          if (Math.abs(y) < epsMax) {
            return rate
          }
          let dy
          if (Math.abs(rate) < epsMax) {
            dy = present * periods + payment * type * periods
          } else {
            const f = Math.pow(1 + rate, periods)
            const df = periods * Math.pow(1 + rate, periods - 1)
            dy = present * df + payment * (1 / rate + type) * df + payment * (-1 / (rate * rate)) * (f - 1)
          }
          rate -= y / dy
        }
        return new CellError(ErrorType.NUM)
      }
    )
  }

  public pv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PV'),
      (rate, periods, payment, future, type) => {
        type = type ? 1 : 0
        if (rate === -1) {
          if (periods === 0) {
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

  public rri(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RRI'),
      (periods, present, future) => {
        if (present === 0 || (future < 0 && present > 0) || (future > 0 && present < 0)) {
          return new CellError(ErrorType.NUM)
        }

        return Math.pow(future / present, 1 / periods) - 1
      }
    )
  }

  public sln(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SLN'),
      (cost, salvage, life) => {
        if (life === 0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        return (cost - salvage) / life
      }
    )
  }

  public syd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SYD'),
      (cost, salvage, life, period) => {
        if (period > life) {
          return new CellError(ErrorType.NUM)
        }
        return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1))
      }
    )
  }

  public tbilleq(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TBILLEQ'),
      (settlement, maturity, discount) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.dateTimeHelper.numberToSimpleDate(settlement)
        const endDate = this.dateTimeHelper.numberToSimpleDate(maturity)
        if (endDate.year > startDate.year + 1 || (endDate.year === startDate.year + 1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        const denom = 360 - discount * (maturity - settlement)
        if (denom === 0) {
          return 0
        }
        if (denom < 0) {
          return new CellError(ErrorType.NUM)
        }
        return 365 * discount / denom
      }
    )
  }

  public tbillprice(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TBILLPRICE'),
      (settlement, maturity, discount) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.dateTimeHelper.numberToSimpleDate(settlement)
        const endDate = this.dateTimeHelper.numberToSimpleDate(maturity)
        if (endDate.year > startDate.year + 1 || (endDate.year === startDate.year + 1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        const denom = 360 - discount * (maturity - settlement)
        if (denom === 0) {
          return 0
        }
        if (denom < 0) {
          return new CellError(ErrorType.NUM)
        }
        return 100 * (1 - discount * (maturity - settlement) / 360)
      }
    )
  }

  public tbillyield(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TBILLYIELD'),
      (settlement, maturity, price) => {
        settlement = Math.round(settlement)
        maturity = Math.round(maturity)
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM)
        }

        const startDate = this.dateTimeHelper.numberToSimpleDate(settlement)
        const endDate = this.dateTimeHelper.numberToSimpleDate(maturity)
        if (endDate.year > startDate.year + 1 || (endDate.year === startDate.year + 1 && (endDate.month > startDate.month || (endDate.month === startDate.month && endDate.day > startDate.day)))) {
          return new CellError(ErrorType.NUM)
        }
        return (100 - price) * 360 / (price * (maturity - settlement))
      }
    )
  }

  public fvschedule(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FVSCHEDULE'),
      (value: number, ratios: SimpleRangeValue) => {
        const vals = ratios.valuesFromTopLeftCorner()
        for (const val of vals) {
          if (val instanceof CellError) {
            return val
          }
        }
        for (const val of vals) {
          if (isExtendedNumber(val)) {
            value *= 1 + getRawValue(val)
          } else if (val !== EmptyValue) {
            return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
          }
        }
        return value
      })
  }

  public npv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NPV'),
      (rate: number, ...args: RawInterpreterValue[]) => {
        const coerced = this.arithmeticHelper.coerceNumbersExactRanges(args)
        if (coerced instanceof CellError) {
          return coerced
        }
        return npvCore(rate, coerced)
      }
    )
  }

  public mirr(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MIRR'),
      (range: SimpleRangeValue, frate: number, rrate: number) => {
        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }
        let posFlag = false
        let negFlag = false
        const posValues: number[] = []
        const negValues: number[] = []
        for (const val of vals) {
          if (val > 0) {
            posFlag = true
            posValues.push(val)
            negValues.push(0)
          } else if (val < 0) {
            negFlag = true
            negValues.push(val)
            posValues.push(0)
          } else {
            negValues.push(0)
            posValues.push(0)
          }
        }
        if (!posFlag || !negFlag) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        const n = vals.length
        const nom = npvCore(rrate, posValues)
        if (nom instanceof CellError) {
          return nom
        }
        const denom = npvCore(frate, negValues)
        if (denom instanceof CellError) {
          return denom
        }
        return Math.pow(
          (-nom * Math.pow(1 + rrate, n) / denom / (1 + frate)),
          1 / (n - 1)
        ) - 1
      }
    )
  }

  public pduration(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PDURATION'),
      (rate: number, pv: number, fv: number) => (Math.log(fv) - Math.log(pv)) / Math.log(1 + rate)
    )
  }

  public xnpv(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XNPV'),
      (rate: number, values: SimpleRangeValue, dates: SimpleRangeValue) => {
        const valArr = values.valuesFromTopLeftCorner()
        for (const val of valArr) {
          if (typeof val !== 'number') {
            return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
          }
        }
        const valArrNum = valArr as number[]
        const dateArr = dates.valuesFromTopLeftCorner()
        for (const date of dateArr) {
          if (typeof date !== 'number') {
            return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
          }
        }
        const dateArrNum = dateArr as number[]
        if (dateArrNum.length !== valArrNum.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.EqualLength)
        }
        const n = dateArrNum.length
        let ret = 0
        if (dateArrNum[0] < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        for (let i = 0; i < n; i++) {
          dateArrNum[i] = Math.floor(dateArrNum[i])
          if (dateArrNum[i] < dateArrNum[0]) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          ret += valArrNum[i] / Math.pow(1 + rate, (dateArrNum[i] - dateArrNum[0]) / 365)
        }
        return ret
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

function npvCore(rate: number, args: number[]): number | CellError {
  let acc = 0
  for (let i = args.length - 1; i >= 0; i--) {
    acc += args[i]
    if (rate === -1) {
      if (acc === 0) {
        continue
      } else {
        return new CellError(ErrorType.DIV_BY_ZERO)
      }
    }
    acc /= 1 + rate
  }
  return acc
}
