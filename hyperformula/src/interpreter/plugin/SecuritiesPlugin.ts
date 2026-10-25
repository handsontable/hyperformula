/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {offsetMonth, SimpleDate} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
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

/**
 * Holds the securities functions, which compute a security's price, yield, discount or interest rate, amount received,
 * accrued interest, or coupon dates and periods from its dates and a day-count basis.
 */
export class SecuritiesPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SecuritiesPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
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
    'COUPDAYBS': {
      method: 'coupdaybs',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'COUPDAYSNC': {
      method: 'coupdaysnc',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'COUPDAYS': {
      method: 'coupdays',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
  }

  /**
   * Corresponds to DISC(settlement, maturity, pr, redemption, [basis]).
   *
   * Returns the discount rate of a security.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * Arguments are validated from left to right, as in Excel; an empty `issue`, `settlement` or `rate` is #N/A.
   * `issue` equal to `settlement` gives 0.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public accrintm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ACCRINTM'),
      (issueArg: InternalScalarValue, settlementArg: InternalScalarValue, rateArg: InternalScalarValue, parArg: InternalScalarValue, basisArg: InternalScalarValue) => {
        if (this.isArgumentEmpty(ast, 0)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const issue = this.coerceToSecurityDate(issueArg)
        if (issue instanceof CellError) {
          return issue
        }
        if (this.isArgumentEmpty(ast, 1)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        if (this.isArgumentEmpty(ast, 2)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
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
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public coupnum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPNUM',
      (schedule: CouponSchedule) => schedule.count
    )
  }

  /**
   * Corresponds to COUPDAYBS(settlement, maturity, frequency, [basis]).
   *
   * Returns the number of days from the previous coupon date to the settlement date, counted by `basis`.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public coupdaybs(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPDAYBS',
      (schedule: CouponSchedule) => this.daysBeforeSettlement(schedule)
    )
  }

  /**
   * Corresponds to COUPDAYSNC(settlement, maturity, frequency, [basis]).
   *
   * Returns the number of days from the settlement date to the next coupon date. Basis 0 counts it as Excel does:
   * the 30/360 length of the coupon period minus COUPDAYBS, so it is not always the direct 30/360 count.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public coupdaysnc(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPDAYSNC',
      (schedule: CouponSchedule) => {
        if (schedule.basis === 0) {
          return this.thirtyDayPeriodLength(schedule) - this.daysBeforeSettlement(schedule)
        }
        const next = this.dateTimeHelper.dateToNumber(schedule.next)
        return this.dateTimeHelper.dayCountByBasis(schedule.settlement, next, schedule.basis).dayCount
      }
    )
  }

  /**
   * Corresponds to COUPDAYS(settlement, maturity, frequency, [basis]).
   *
   * Returns the number of days in the coupon period that contains the settlement date: 360 / `frequency` for bases
   * 0, 2 and 4, 365 / `frequency` for basis 3, and the actual length of the period, as Excel computes it, for basis 1.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public coupdays(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.couponFunction(ast, state, 'COUPDAYS',
      (schedule: CouponSchedule) => {
        switch (schedule.basis) {
          case 1:
            return this.actualCouponPeriodLength(schedule)
          case 3:
            return 365 / schedule.frequency
          default:
            return 360 / schedule.frequency
        }
      }
    )
  }

  /**
   * Runs DISC, INTRATE, PRICEDISC, RECEIVED and YIELDDISC, which share the arguments
   * (settlement, maturity, first amount, second amount, [basis]).
   *
   * Validates in Excel's order: settlement and maturity, then basis, then the two amounts (errors and #VALUE!),
   * then settlement before maturity and both amounts positive (#NUM!). An empty settlement, maturity or amount is #N/A
   * in its own place of that order. Passes the day count and the days in the year between settlement and maturity to
   * `calculate`.
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
        if (this.isArgumentEmpty(ast, 0)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        if (this.isArgumentEmpty(ast, 1)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const maturity = this.coerceToSecurityDate(maturityArg)
        if (maturity instanceof CellError) {
          return maturity
        }
        const basis = this.coerceToDayCountBasis(basisArg)
        if (basis instanceof CellError) {
          return basis
        }
        if (this.isArgumentEmpty(ast, 2)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const firstAmount = this.strictNumber(firstAmountArg)
        if (firstAmount instanceof CellError) {
          return firstAmount
        }
        if (this.isArgumentEmpty(ast, 3)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
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
   * Returns true when the argument at `index` is syntactically empty, as the first argument of `DISC(,A3,A4,A5)`.
   * An omitted trailing argument is not empty.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {number} index - the argument's position, from 0
   */
  private isArgumentEmpty(ast: ProcedureAst, index: number): boolean {
    return ast.args[index]?.type === AstNodeType.EMPTY
  }

  /**
   * Runs COUPPCD, COUPNCD, COUPNUM, COUPDAYBS, COUPDAYSNC and COUPDAYS, which share the arguments
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

  /**
   * Returns the number of days from the previous coupon date to settlement, counted by the schedule's basis.
   */
  private daysBeforeSettlement(schedule: CouponSchedule): number {
    const previous = this.dateTimeHelper.dateToNumber(schedule.previous)
    return this.dateTimeHelper.dayCountByBasis(previous, schedule.settlement, schedule.basis).dayCount
  }

  /**
   * Returns the 30/360 length of the coupon period, from the previous to the next coupon date, as Excel counts it for
   * COUPDAYSNC with basis 0: day 31 and the last day of February count as day 30 at both ends. The two dates are
   * exactly 12 / `frequency` months apart, so only their days change the length (for example 179 days from
   * 28 February to 29 August).
   */
  private thirtyDayPeriodLength(schedule: CouponSchedule): number {
    return 360 / schedule.frequency + this.thirtyDayMonthDay(schedule.next) - this.thirtyDayMonthDay(schedule.previous)
  }

  /**
   * Returns the day of the month of `date` in a 30-day month: 30 for day 31 and for the last day of February,
   * otherwise the day itself.
   */
  private thirtyDayMonthDay(date: SimpleDate): number {
    const isFebruaryEnd = date.month === 2 && date.day === this.dateTimeHelper.daysInMonth(date.year, 2)
    return date.day === 31 || isFebruaryEnd ? 30 : date.day
  }

  /**
   * Returns the length in days of the coupon period that contains settlement, as Excel's COUPDAYS computes it for
   * basis 1. It is not always the next coupon date minus the previous one.
   *
   * 1. Step back from maturity one period at a time, each date keeping the previous date's day clamped to its month
   *    (so 31 March, 30 September, 30 March: the day can only go down). Stop at the last date whose next step back is
   *    on or before settlement: the period end.
   * 2. Step back once from the period end with the end-of-month rule of `couponDate`: the period start.
   * 3. If the period start is still after settlement, it becomes the period end and step 2 repeats. This happens at
   *    most once.
   *
   * The result is the period end minus the period start. Constant time: the period end is the drifted date
   * `count - 1` periods back, or `count - 2` when that one is already on or before settlement.
   */
  private actualCouponPeriodLength(schedule: CouponSchedule): number {
    const {settlement, maturity, frequency, count} = schedule
    let periodEnd = this.driftedCouponDate(maturity, count - 1, frequency)
    if (count >= 2 && this.dateTimeHelper.dateToNumber(periodEnd) <= settlement) {
      periodEnd = this.driftedCouponDate(maturity, count - 2, frequency)
    }
    let periodStart = this.couponDate(periodEnd, -1, frequency)
    if (this.dateTimeHelper.dateToNumber(periodStart) > settlement) {
      periodEnd = periodStart
      periodStart = this.couponDate(periodEnd, -1, frequency)
    }
    return this.dateTimeHelper.dateToNumber(periodEnd) - this.dateTimeHelper.dateToNumber(periodStart)
  }

  /**
   * Returns `maturity` stepped back `periods` coupon periods, each step keeping the previous date's day clamped to the
   * length of its month, so the day can drift down (31 March, 30 September, 30 March).
   *
   * Constant time: the drifted day is the smallest of maturity's day and the lengths of the months visited, and those
   * months repeat every year, so after `2 * frequency` steps (two Februaries, at least one in a non-leap year) the
   * day no longer changes.
   */
  private driftedCouponDate(maturity: SimpleDate, periods: number, frequency: number): SimpleDate {
    const monthsPerPeriod = 12 / frequency
    let day = maturity.day
    for (let step = 1; step <= Math.min(periods, 2 * frequency); step++) {
      const visited = offsetMonth(maturity, -step * monthsPerPeriod)
      day = Math.min(day, this.dateTimeHelper.daysInMonth(visited.year, visited.month))
    }
    const target = offsetMonth(maturity, -periods * monthsPerPeriod)
    return {...target, day: Math.min(day, this.dateTimeHelper.daysInMonth(target.year, target.month))}
  }
}
