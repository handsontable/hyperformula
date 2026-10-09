/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {offsetMonth, SimpleDate} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
  RawInterpreterValue
} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * The coupon schedule of a coupon function call, built once from its validated arguments.
 */
interface CouponSchedule {
  /** The settlement date serial, truncated. */
  settlement: number,
  /** The maturity date. */
  maturity: SimpleDate,
  /** The number of coupons per year: 1, 2 or 4. */
  frequency: number,
  /** The day-count basis: 0 to 4. */
  basis: number,
  /** The number of coupon dates after settlement, up to and including maturity. */
  count: number,
  /** The last coupon date on or before settlement. */
  previous: SimpleDate,
  /** The first coupon date after settlement. */
  next: SimpleDate,
}

export class FinancialPlugin extends FunctionPlugin implements FunctionPluginTypecheck<FinancialPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'PMT': {
      method: 'pmt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'IPMT': {
      method: 'ipmt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'PPMT': {
      method: 'ppmt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'FV': {
      method: 'fv',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'CUMIPMT': {
      method: 'cumipmt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 0, maxValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'CUMPRINC': {
      method: 'cumprinc',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 0, maxValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DB': {
      method: 'db',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1, maxValue: 12, defaultValue: 12},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DDB': {
      method: 'ddb',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0, defaultValue: 2},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'DOLLARDE': {
      method: 'dollarde',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
      ],
    },
    'DOLLARFR': {
      method: 'dollarfr',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
      ],
    },
    'EFFECT': {
      method: 'effect',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'ISPMT': {
      method: 'ispmt',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
    },
    'NOMINAL': {
      method: 'nominal',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'NPER': {
      method: 'nper',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
    },
    'PV': {
      method: 'pv',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'RATE': {
      method: 'rate',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0.1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'RRI': {
      method: 'rri',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'SLN': {
      method: 'sln',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'SYD': {
      method: 'syd',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'TBILLEQ': {
      method: 'tbilleq',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'TBILLPRICE': {
      method: 'tbillprice',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'TBILLYIELD': {
      method: 'tbillyield',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, minValue: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'DISC': {
      method: 'disc',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'INTRATE': {
      method: 'intrate',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'PRICEDISC': {
      method: 'pricedisc',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'RECEIVED': {
      method: 'received',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'YIELDDISC': {
      method: 'yielddisc',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'ACCRINTM': {
      method: 'accrintm',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 1000, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'COUPPCD': {
      method: 'couppcd',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'COUPNCD': {
      method: 'coupncd',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'COUPNUM': {
      method: 'coupnum',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'FVSCHEDULE': {
      method: 'fvschedule',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.RANGE},
      ],
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'NPV': {
      method: 'npv',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.ANY},
      ],
      repeatLastArgs: 1,
      returnNumberType: NumberType.NUMBER_CURRENCY
    },
    'MIRR': {
      method: 'mirr',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'PDURATION': {
      method: 'pduration',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: 0},
      ],
    },
    'XNPV': {
      method: 'xnpv',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER, greaterThan: -1},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
      ],
    },
    'IRR': {
      method: 'irr',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0.1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
    },
    'XIRR': {
      method: 'xirr',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0.1},
      ],
      returnNumberType: NumberType.NUMBER_PERCENT
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
      (dollar: number, fraction: number) => {
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
      (dollar: number, fraction: number) => {
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
      (rate: number, payment: number, present: number, future: number, type: number) => {
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
    // Newton's method: https://en.wikipedia.org/wiki/Newton%27s_method
    return this.runFunction(ast.args, state, this.metadata('RATE'),
      (periods: number, payment: number, present: number, future: number, type: number, guess: number) => {
        if (guess <= -1) {
          return new CellError(ErrorType.VALUE)
        }

        const epsMax = 1e-7

        const iterMax = 50

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
      (rate: number, periods: number, payment: number, future: number, type: number) => {
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
      (cost: number, salvage: number, life: number, period: number) => {
        if (period > life) {
          return new CellError(ErrorType.NUM)
        }
        return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1))
      }
    )
  }

  public tbilleq(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TBILLEQ'),
      (settlement: number, maturity: number, discount: number) => {
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
      (settlement: number, maturity: number, discount: number) => {
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
      (settlement: number, maturity: number, price: number) => {
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

  /**
   * Corresponds to DISC(settlement, maturity, pr, redemption, [basis]).
   *
   * Returns the discount rate of a security.
   *
   * @param ast
   * @param state
   */
  public disc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.discountedSecurity(ast, state, 'DISC',
      (dayCount: number, yearDays: number, price: number, redemption: number) => (1 - price / redemption) * (yearDays / dayCount)
    )
  }

  /**
   * Corresponds to INTRATE(settlement, maturity, investment, redemption, [basis]).
   *
   * Returns the interest rate of a fully invested security.
   *
   * @param ast
   * @param state
   */
  public intrate(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.discountedSecurity(ast, state, 'INTRATE',
      (dayCount: number, yearDays: number, investment: number, redemption: number) => (redemption - investment) / investment * (yearDays / dayCount)
    )
  }

  /**
   * Corresponds to PRICEDISC(settlement, maturity, discount, redemption, [basis]).
   *
   * Returns the price per $100 face value of a discounted security.
   *
   * @param ast
   * @param state
   */
  public pricedisc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.discountedSecurity(ast, state, 'PRICEDISC',
      (dayCount: number, yearDays: number, discount: number, redemption: number) => redemption - discount * redemption * (dayCount / yearDays)
    )
  }

  /**
   * Corresponds to RECEIVED(settlement, maturity, investment, discount, [basis]).
   *
   * Returns the amount received at maturity for a fully invested security.
   * Returns #NUM! when the discount for the whole period reaches the investment, that is when
   * `discount * dayCount / yearDays` is 1 or more.
   *
   * @param ast
   * @param state
   */
  public received(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.discountedSecurity(ast, state, 'RECEIVED',
      (dayCount: number, yearDays: number, investment: number, discount: number) => {
        const denominator = 1 - discount * (dayCount / yearDays)
        if (denominator <= 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
        }
        return investment / denominator
      }
    )
  }

  /**
   * Corresponds to YIELDDISC(settlement, maturity, pr, redemption, [basis]).
   *
   * Returns the annual yield of a discounted security.
   *
   * @param ast
   * @param state
   */
  public yielddisc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.discountedSecurity(ast, state, 'YIELDDISC',
      (dayCount: number, yearDays: number, price: number, redemption: number) => (redemption - price) / price * (yearDays / dayCount)
    )
  }

  /**
   * Corresponds to ACCRINTM(issue, settlement, rate, [par], [basis]).
   *
   * Returns the accrued interest of a security that pays interest at maturity. An empty or omitted `par` is 1000.
   * Arguments are validated from left to right, as in Excel. `issue` equal to `settlement` gives 0.
   *
   * @param ast
   * @param state
   */
  public accrintm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ACCRINTM'),
      (issueArg: InternalScalarValue, settlementArg: InternalScalarValue, rateArg: InternalScalarValue, parArg: InternalScalarValue, basisArg: InternalScalarValue) => {
        const issue = this.coerceToSecurityDate(issueArg)
        if (issue instanceof CellError) {
          return issue
        }
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        const rate = this.strictNumber(rateArg)
        if (rate instanceof CellError) {
          return rate
        }
        const par = this.strictNumber(parArg)
        if (par instanceof CellError) {
          return par
        }
        const basis = this.coerceToDayCountBasis(basisArg)
        if (basis instanceof CellError) {
          return basis
        }
        if (issue > settlement) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (rate <= 0 || par <= 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        const {dayCount, yearDays} = this.dateTimeHelper.dayCountByBasis(issue, settlement, basis)
        return par * rate * (dayCount / yearDays)
      }
    )
  }

  /**
   * Corresponds to COUPPCD(settlement, maturity, frequency, [basis]).
   *
   * Returns the last coupon date on or before the settlement date, as a date serial number.
   *
   * @param ast
   * @param state
   */
  public couppcd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPPCD',
      (schedule: CouponSchedule) => this.dateTimeHelper.dateToNumber(schedule.previous)
    )
  }

  /**
   * Corresponds to COUPNCD(settlement, maturity, frequency, [basis]).
   *
   * Returns the first coupon date after the settlement date, as a date serial number.
   *
   * @param ast
   * @param state
   */
  public coupncd(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPNCD',
      (schedule: CouponSchedule) => this.dateTimeHelper.dateToNumber(schedule.next)
    )
  }

  /**
   * Corresponds to COUPNUM(settlement, maturity, frequency, [basis]).
   *
   * Returns the number of coupons payable after the settlement date, up to and including the maturity date.
   *
   * @param ast
   * @param state
   */
  public coupnum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPNUM',
      (schedule: CouponSchedule) => schedule.count
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

  /**
   * Calculates the internal rate of return for a series of cash flows.
   * @param {ProcedureAst} ast - The AST node representing the function call.
   * @param {InterpreterState} state - The interpreter state.
   * @returns {InterpreterValue} The internal rate of return.
   */
  public irr(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('IRR'),
      (range: SimpleRangeValue, guess: number) => {
        if (guess <= -1) {
          return new CellError(ErrorType.VALUE)
        }

        const vals = this.arithmeticHelper.manyToExactNumbers(range.valuesFromTopLeftCorner())
        if (vals instanceof CellError) {
          return vals
        }

        // Check for at least one positive and one negative value
        const hasPositive = vals.some(val => val > 0)
        const hasNegative = vals.some(val => val < 0)
        if (!hasPositive || !hasNegative) {
          return new CellError(ErrorType.NUM)
        }

        return irrCore(vals, guess)
      }
    )
  }

  /**
   * Calculates the internal rate of return for a schedule of cash flows that is not necessarily periodic.
   * @param {ProcedureAst} ast - The AST node representing the function call.
   * @param {InterpreterState} state - The interpreter state.
   * @returns {InterpreterValue} The internal rate of return.
   */
  public xirr(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('XIRR'),
      (values: SimpleRangeValue, dates: SimpleRangeValue, guess: number) => {
        if (guess <= -1) {
          return new CellError(ErrorType.NUM)
        }

        const cashFlows = sanitizeXirrRange(values.valuesFromTopLeftCorner())
        if (cashFlows instanceof CellError) {
          return cashFlows
        }

        const paymentDates = sanitizeXirrRange(dates.valuesFromTopLeftCorner())
        if (paymentDates instanceof CellError) {
          return paymentDates
        }

        if (cashFlows.length !== paymentDates.length) {
          return new CellError(ErrorType.NUM, ErrorMessage.EqualLength)
        }

        // A schedule needs at least two cash flows to define a rate of return.
        if (cashFlows.length < 2) {
          return new CellError(ErrorType.NA)
        }

        const hasPositive = cashFlows.some(value => value > 0)
        const hasNegative = cashFlows.some(value => value < 0)
        if (!hasPositive || !hasNegative) {
          return new CellError(ErrorType.NUM)
        }

        return xirrCore(cashFlows, paymentDates, guess)
      }
    )
  }

  /**
   * Runs DISC, INTRATE, PRICEDISC, RECEIVED and YIELDDISC, which share the arguments
   * (settlement, maturity, first amount, second amount, [basis]).
   *
   * Validates in Excel's order: settlement and maturity, then basis, then the two amounts (errors and #VALUE!),
   * then settlement before maturity and both amounts positive (#NUM!). Passes the day count and the days in the year
   * between settlement and maturity to `calculate`.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   * @param {string} functionName - the function's id, used to look up its metadata
   * @param {Function} calculate - computes the result from the day count, the days in the year and the two amounts
   */
  private discountedSecurity(
    ast: ProcedureAst,
    state: InterpreterState,
    functionName: string,
    calculate: (dayCount: number, yearDays: number, firstAmount: number, secondAmount: number) => number | CellError,
  ): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (settlementArg: InternalScalarValue, maturityArg: InternalScalarValue, firstAmountArg: InternalScalarValue, secondAmountArg: InternalScalarValue, basisArg: InternalScalarValue) => {
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        const maturity = this.coerceToSecurityDate(maturityArg)
        if (maturity instanceof CellError) {
          return maturity
        }
        const basis = this.coerceToDayCountBasis(basisArg)
        if (basis instanceof CellError) {
          return basis
        }
        const firstAmount = this.strictNumber(firstAmountArg)
        if (firstAmount instanceof CellError) {
          return firstAmount
        }
        const secondAmount = this.strictNumber(secondAmountArg)
        if (secondAmount instanceof CellError) {
          return secondAmount
        }
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (firstAmount <= 0 || secondAmount <= 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        const {dayCount, yearDays} = this.dateTimeHelper.dayCountByBasis(settlement, maturity, basis)
        return calculate(dayCount, yearDays, firstAmount, secondAmount)
      }
    )
  }

  /**
   * Runs COUPPCD, COUPNCD and COUPNUM, which share the arguments
   * (settlement, maturity, frequency, [basis]).
   *
   * Validates in Excel's order: settlement, maturity, settlement before maturity, then an empty settlement, maturity
   * or frequency argument (#N/A), then frequency and basis. An empty date is not compared with the other date. Builds
   * the coupon schedule and passes it to `calculate`. A previous coupon date before the earliest supported date is
   * #NUM!.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   * @param {string} functionName - the function's id, used to look up its metadata
   * @param {Function} calculate - computes the result from the coupon schedule
   */
  private couponFunction(
    ast: ProcedureAst,
    state: InterpreterState,
    functionName: string,
    calculate: (schedule: CouponSchedule) => number,
  ): InterpreterValue {
    const isArgumentEmpty = (index: number) => ast.args[index]?.type === AstNodeType.EMPTY
    const isDateEmpty = isArgumentEmpty(0) || isArgumentEmpty(1)
    const isFrequencyEmpty = isArgumentEmpty(2)
    return this.runFunction(ast.args, state, this.metadata(functionName),
      (settlementArg: InternalScalarValue, maturityArg: InternalScalarValue, frequencyArg: InternalScalarValue, basisArg: InternalScalarValue) => {
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        const maturity = this.coerceToSecurityDate(maturityArg)
        if (maturity instanceof CellError) {
          return maturity
        }
        if (!isDateEmpty && settlement >= maturity) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (isDateEmpty || isFrequencyEmpty) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const frequency = this.coerceToCouponFrequency(frequencyArg)
        if (frequency instanceof CellError) {
          return frequency
        }
        const basis = this.coerceToDayCountBasis(basisArg)
        if (basis instanceof CellError) {
          return basis
        }
        const maturityDate = this.dateTimeHelper.numberToSimpleDate(maturity)
        const count = this.couponsAfter(settlement, maturityDate, frequency)
        const previous = this.couponDate(maturityDate, -count, frequency)
        if (this.dateTimeHelper.dateToNumber(previous) < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
        }
        const next = this.couponDate(maturityDate, 1 - count, frequency)
        return calculate({settlement, maturity: maturityDate, frequency, basis, count, previous, next})
      }
    )
  }

  /**
   * Converts a date argument of a securities function: a number as `strictNumber` accepts it, truncated to an integer.
   * A date outside the supported range is #NUM!, and so is a negative value even when it truncates to 0, as in Excel.
   */
  private coerceToSecurityDate(value: InternalScalarValue): number | CellError {
    const dateNumber = this.strictNumber(value)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }
    if (dateNumber < 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    const date = Math.trunc(dateNumber)
    if (this.dateTimeHelper.getWithinBounds(date) === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    return date
  }

  /**
   * Converts the day-count `basis` argument of a securities function: a number as `strictNumber` accepts it, from 0
   * to less than 5, truncated to an integer. A negative value is #NUM! even when it truncates to 0, as in Excel.
   */
  private coerceToDayCountBasis(value: InternalScalarValue): number | CellError {
    const basis = this.strictNumber(value)
    if (basis instanceof CellError) {
      return basis
    }
    if (basis < 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
    }
    if (basis >= 5) {
      return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
    }
    return Math.trunc(basis)
  }

  /**
   * Converts the `frequency` argument of a coupon function: a number as `strictNumber` accepts it, truncated to an
   * integer, that must be 1 (annual), 2 (semiannual) or 4 (quarterly).
   */
  private coerceToCouponFrequency(value: InternalScalarValue): number | CellError {
    const frequency = this.strictNumber(value)
    if (frequency instanceof CellError) {
      return frequency
    }
    const truncated = Math.trunc(frequency)
    if (truncated !== 1 && truncated !== 2 && truncated !== 4) {
      return new CellError(ErrorType.NUM, ErrorMessage.CouponFrequency)
    }
    return truncated
  }

  /**
   * Converts an argument the way Excel does for these functions: numbers, dates, numeric text and empty cells are
   * accepted, while a boolean or the empty text is #VALUE!. Errors are passed on.
   */
  private strictNumber(value: InternalScalarValue): number | CellError {
    if (value instanceof CellError) {
      return value
    }
    if (typeof value === 'boolean' || value === '') {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
    }
    const coerced = this.coerceScalarToNumberOrError(value)
    return coerced instanceof CellError ? coerced : getRawValue(coerced)
  }

  /**
   * Returns the coupon date `periods` coupon periods after `anchor` (before it when negative). The date is computed
   * from the anchor directly, so the day of the month never drifts: if the anchor is the last day of its month, so is
   * the result; otherwise the result keeps the anchor's day, clamped to the length of its month (leap years included).
   */
  private couponDate(anchor: SimpleDate, periods: number, frequency: number): SimpleDate {
    const shifted = offsetMonth(anchor, periods * 12 / frequency)
    const lastDay = this.dateTimeHelper.daysInMonth(shifted.year, shifted.month)
    const isAnchorMonthEnd = anchor.day === this.dateTimeHelper.daysInMonth(anchor.year, anchor.month)
    return {...shifted, day: isAnchorMonthEnd ? lastDay : Math.min(anchor.day, lastDay)}
  }

  /**
   * Returns the number of coupon dates after `settlement`, up to and including `maturity`: the smallest k >= 1 for
   * which the coupon date k periods before maturity is on or before settlement.
   *
   * Runs in constant time instead of stepping through the periods (a quarterly schedule over the whole supported date
   * range has 32,400 of them): the whole periods in the months between settlement and maturity give a coupon date in
   * settlement's month or later, and one period more gives a date before settlement's month.
   */
  private couponsAfter(settlement: number, maturity: SimpleDate, frequency: number): number {
    const settlementDate = this.dateTimeHelper.numberToSimpleDate(settlement)
    const months = 12 * (maturity.year - settlementDate.year) + maturity.month - settlementDate.month
    const periods = Math.floor(months * frequency / 12)
    if (periods > 0 && this.dateTimeHelper.dateToNumber(this.couponDate(maturity, -periods, frequency)) <= settlement) {
      return periods
    }
    return periods + 1
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

/**
 * Calculates IRR using Newton-Raphson method.
 * IRR is the rate r where: CF0 + CF1/(1+r) + CF2/(1+r)^2 + ... + CFn/(1+r)^n = 0
 */
function irrCore(values: number[], guess: number): number | CellError {
  const epsMax = 1e-10
  const iterMax = 50

  let rate = guess

  for (let iter = 0; iter < iterMax; iter++) {
    // Calculate NPV and its derivative at current rate
    // NPV = sum of values[i] / (1+rate)^i for i = 0 to n-1
    // dNPV/dr = sum of -i * values[i] / (1+rate)^(i+1) for i = 0 to n-1
    let npv = 0
    let dnpv = 0

    for (let i = 0; i < values.length; i++) {
      const factor = Math.pow(1 + rate, i)
      if (!isFinite(factor) || factor === 0) {
        return new CellError(ErrorType.NUM)
      }
      npv += values[i] / factor
      if (i > 0) {
        dnpv -= i * values[i] / (factor * (1 + rate))
      }
    }

    // Check for convergence
    if (Math.abs(npv) < epsMax) {
      return rate
    }

    // Check if derivative is too small (avoid division by zero)
    if (Math.abs(dnpv) < epsMax) {
      return new CellError(ErrorType.NUM)
    }

    // Newton-Raphson step
    let newRate = rate - npv / dnpv

    if (!isFinite(newRate)) {
      return new CellError(ErrorType.NUM)
    }

    // Clamp: when Newton overshoots past -1, bisect between current rate and -1
    if (newRate <= -1) {
      newRate = (rate - 1) / 2
    }

    // Check for convergence based on rate change
    if (Math.abs(newRate - rate) < epsMax) {
      return newRate
    }

    rate = newRate
  }

  return new CellError(ErrorType.NUM)
}

/**
 * Converts raw range values into an array of numbers for XIRR.
 *
 * Empty cells are treated as zeros, errors are propagated, and any non-numeric
 * value (text or logical) results in a #VALUE! error.
 * @param {InternalScalarValue[]} rawValues - The raw values taken from a range.
 * @returns {number[] | CellError} The numeric values, or a propagated/coercion error.
 */
function sanitizeXirrRange(rawValues: InternalScalarValue[]): number[] | CellError {
  const result: number[] = []
  for (const rawValue of rawValues) {
    if (rawValue instanceof CellError) {
      return rawValue
    } else if (rawValue === EmptyValue) {
      result.push(0)
    } else if (isExtendedNumber(rawValue)) {
      result.push(getRawValue(rawValue))
    } else {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
    }
  }
  return result
}

/**
 * Calculates XIRR using the Newton-Raphson method.
 *
 * XIRR is the rate r for which the net present value of the cash flows, discounted
 * over the actual number of days between payments (assuming a 365-day year), equals zero:
 * sum( values[i] / (1 + r)^((dates[i] - dates[0]) / 365) ) = 0
 * @param {number[]} values - The cash flow amounts.
 * @param {number[]} dates - The payment dates as serial numbers, aligned with `values`.
 * @param {number} guess - The initial estimate of the rate of return.
 * @returns {number | CellError} The internal rate of return, or a #NUM! error.
 */
function xirrCore(values: number[], dates: number[], guess: number): number | CellError {
  const epsMax = 1e-10
  const iterMax = 50

  const startDate = Math.floor(dates[0])
  if (startDate < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
  }

  const dayOffsets: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const truncatedDate = Math.floor(dates[i])
    if (truncatedDate < startDate) {
      return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
    }
    dayOffsets.push(truncatedDate - startDate)
  }

  let rate = guess

  for (let iter = 0; iter < iterMax; iter++) {
    // Calculate XNPV and its derivative at the current rate.
    let npv = 0
    let dnpv = 0

    for (let i = 0; i < values.length; i++) {
      const exponent = dayOffsets[i] / 365
      const base = 1 + rate
      const factor = Math.pow(base, exponent)
      if (!isFinite(factor) || factor === 0) {
        return new CellError(ErrorType.NUM)
      }
      npv += values[i] / factor
      dnpv -= exponent * values[i] / (factor * base)
    }

    if (!isFinite(npv) || !isFinite(dnpv)) {
      return new CellError(ErrorType.NUM)
    }

    // Check for convergence.
    if (Math.abs(npv) < epsMax) {
      return rate
    }

    // Check if the derivative is too small (avoid division by zero).
    if (Math.abs(dnpv) < epsMax) {
      return new CellError(ErrorType.NUM)
    }

    // Newton-Raphson step.
    let newRate = rate - npv / dnpv
    if (!isFinite(newRate)) {
      return new CellError(ErrorType.NUM)
    }

    // Clamp: when Newton overshoots past -1, bisect between current rate and -1.
    if (newRate <= -1) {
      newRate = (rate - 1) / 2
    }

    // Check for convergence based on rate change.
    if (Math.abs(newRate - rate) < epsMax) {
      return newRate
    }

    rate = newRate
  }

  return new CellError(ErrorType.NUM)
}
