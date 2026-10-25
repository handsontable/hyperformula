/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {daysIn30DayMonths, offsetMonth, SimpleDate, toBasisEU} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {
  actualCouponPeriodLength,
  couponDate,
  CouponSchedule,
  daysBeforeSettlement,
  thirtyDayPeriodLength,
} from './CouponSchedule'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * The quasi-coupon schedule of an ACCRINT call: coupon dates anchored at `first_interest`. Period k runs from the
 * coupon date k periods after `first_interest` (before it when k is negative) to the next coupon date.
 */
interface QuasiCouponSchedule {
  /** The first interest date, the anchor of the schedule. */
  firstInterest: SimpleDate,
  /** The number of coupons per year: 1, 2 or 4. */
  frequency: number,
  /** The day-count basis: 0 to 4. */
  basis: number,
}

/**
 * The index of the quasi-coupon period that ends on `first_interest`.
 */
const FIRST_INTEREST_PERIOD = -1

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
    'ACCRINT': {
      method: 'accrint',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 1000, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: true, emptyAsDefault: true},
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
      (schedule: CouponSchedule) => daysBeforeSettlement(this.dateTimeHelper, schedule)
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
          return thirtyDayPeriodLength(this.dateTimeHelper, schedule) - daysBeforeSettlement(this.dateTimeHelper, schedule)
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
            return actualCouponPeriodLength(this.dateTimeHelper, schedule)
          case 3:
            return 365 / schedule.frequency
          default:
            return 360 / schedule.frequency
        }
      }
    )
  }

  /**
   * Corresponds to ACCRINT(issue, first_interest, settlement, rate, [par], frequency, [basis], [calc_method]).
   *
   * Returns the accrued interest of a security that pays periodic interest: `par` * `rate` / `frequency` times the
   * accrued time in coupon periods, as `accruedCouponPeriods` computes it. An empty `par` is 1000, and an empty or
   * omitted `calc_method` is TRUE.
   *
   * Validates in Excel's order: `calc_method` first, then the other arguments from left to right (an empty required
   * argument is #N/A), then `rate` and `par` greater than 0, then `issue` before `settlement`. `first_interest` may be
   * on or before `issue`.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public accrint(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ACCRINT'),
      (issueArg: InternalScalarValue, firstInterestArg: InternalScalarValue, settlementArg: InternalScalarValue, rateArg: InternalScalarValue,
        parArg: InternalScalarValue, frequencyArg: InternalScalarValue, basisArg: InternalScalarValue, calcMethodArg: InternalScalarValue) => {
        const calcMethod = this.coerceToCalcMethod(calcMethodArg)
        if (calcMethod instanceof CellError) {
          return calcMethod
        }
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
        const firstInterest = this.coerceToSecurityDate(firstInterestArg)
        if (firstInterest instanceof CellError) {
          return firstInterest
        }
        if (this.isArgumentEmpty(ast, 2)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const settlement = this.coerceToSecurityDate(settlementArg)
        if (settlement instanceof CellError) {
          return settlement
        }
        if (this.isArgumentEmpty(ast, 3)) {
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
        if (this.isArgumentEmpty(ast, 5)) {
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
        if (rate <= 0 || par <= 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        if (issue >= settlement) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        const schedule = {firstInterest: this.dateTimeHelper.numberToSimpleDate(firstInterest), frequency, basis}
        const periods = this.accruedCouponPeriods(schedule, issue, settlement, calcMethod)
        if (periods instanceof CellError) {
          return periods
        }
        return par * rate / frequency * periods
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
        const count = -this.couponPeriodIndex(settlement, maturityDate, frequency)
        const previous = couponDate(this.dateTimeHelper, maturityDate, -count, frequency)
        if (this.dateTimeHelper.dateToNumber(previous) < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
        }
        const next = couponDate(this.dateTimeHelper, maturityDate, 1 - count, frequency)
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
   * Returns the index k of the coupon period that contains `date` in the schedule anchored at `anchor`: the coupon
   * date k periods after the anchor is on or before `date` and the next coupon date is after it. k is negative for a
   * date before the anchor, and 0 for the anchor itself. The coupon functions count the coupons after settlement as
   * minus the index of settlement in maturity's schedule.
   *
   * Runs in constant time instead of stepping through the periods (a quarterly schedule over the whole supported date
   * range has 32,400 of them): the whole periods in the months from the anchor to `date` give a coupon date in
   * `date`'s month or earlier, and the next coupon date is in a later month, so k is that number of periods or one
   * less.
   */
  private couponPeriodIndex(date: number, anchor: SimpleDate, frequency: number): number {
    const {year, month} = this.dateTimeHelper.numberToSimpleDate(date)
    const periods = Math.floor((12 * (year - anchor.year) + month - anchor.month) * frequency / 12)
    if (this.dateTimeHelper.dateToNumber(couponDate(this.dateTimeHelper, anchor, periods, frequency)) <= date) {
      return periods
    }
    return periods - 1
  }

  /**
   * Converts the `calc_method` argument of ACCRINT: an error is passed on, text (even "TRUE" or "1") is #VALUE!, a
   * number is TRUE when it is not 0, and a blank cell is FALSE.
   */
  private coerceToCalcMethod(value: InternalScalarValue): boolean | CellError {
    const calcMethod = typeof value === 'string' ? undefined : coerceScalarToBoolean(value)
    return calcMethod ?? new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
  }

  /**
   * Returns the interest that ACCRINT accrues from `issue` to `settlement` in coupon periods (the result divided by
   * `par` * `rate` / `frequency`), as Excel computes it. "The issue's period" and "the settlement's period" are the
   * periods of `schedule` that contain them.
   *
   * - Settlement after `first_interest`: `accrualFromIssue` up to the settlement's period, or with `calcMethod` FALSE
   *   up to `first_interest`'s period, so that the time from the start of that period to settlement counts as one span.
   * - Settlement on or before `first_interest`, with `calcMethod` FALSE and issue in an earlier period than
   *   settlement: `partialPeriodsBeforeFirstInterest`.
   * - Otherwise, settlement in a period before `first_interest`'s: `accrualBeforeFirstInterestPeriod`.
   * - Otherwise: `accrualFromIssue` up to `first_interest`'s period.
   *
   * The coupon date on or before issue must not be before the earliest supported date and, for a settlement after
   * `first_interest`, the coupon date after settlement must not be after the latest one (#NUM! otherwise).
   *
   * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
   * @param {number} issue - the issue date serial
   * @param {number} settlement - the settlement date serial, after `issue`
   * @param {boolean} calcMethod - the `calc_method` argument
   */
  private accruedCouponPeriods(schedule: QuasiCouponSchedule, issue: number, settlement: number, calcMethod: boolean): number | CellError {
    const issuePeriod = this.couponPeriodIndex(issue, schedule.firstInterest, schedule.frequency)
    if (this.quasiCouponDate(schedule, issuePeriod) < 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    const firstInterest = this.quasiCouponDate(schedule, 0)
    if (settlement > firstInterest) {
      const settlementPeriod = this.periodEndingOnOrAfter(schedule, settlement)
      if (this.dateTimeHelper.getWithinBounds(this.quasiCouponDate(schedule, settlementPeriod + 1)) === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
      }
      return this.accrualFromIssue(schedule, issue, issuePeriod, settlement, calcMethod ? settlementPeriod : FIRST_INTEREST_PERIOD)
    }
    const settlementPeriod = settlement === firstInterest
      ? FIRST_INTEREST_PERIOD
      : this.couponPeriodIndex(settlement, schedule.firstInterest, schedule.frequency)
    if (!calcMethod && issuePeriod !== settlementPeriod) {
      return this.partialPeriodsBeforeFirstInterest(schedule, issue, issuePeriod, settlement, settlementPeriod)
    }
    if (settlementPeriod < FIRST_INTEREST_PERIOD) {
      return this.accrualBeforeFirstInterestPeriod(schedule, issue, issuePeriod, settlement, settlementPeriod)
    }
    return this.accrualFromIssue(schedule, issue, issuePeriod, settlement, FIRST_INTEREST_PERIOD)
  }

  /**
   * Returns the index of the period that contains `settlement`, or of the period before it when settlement is on a
   * coupon date: a settlement on a coupon date ends the period before.
   */
  private periodEndingOnOrAfter(schedule: QuasiCouponSchedule, settlement: number): number {
    const period = this.couponPeriodIndex(settlement, schedule.firstInterest, schedule.frequency)
    return this.quasiCouponDate(schedule, period) === settlement ? period - 1 : period
  }

  /**
   * Returns the accrued coupon periods from `issue` to `settlement` when settlement is in `lastPeriod`: the issue's
   * partial period (`issuePeriodPart`), plus the days from the start of `lastPeriod` to settlement over the length of
   * `first_interest`'s period, plus each whole period in between. When `lastPeriod` is not after the issue's period,
   * the days from issue to settlement over the length of `first_interest`'s period.
   *
   * The whole periods are added one at a time, in Excel's order of additions: O(n) in their number. A period after
   * `first_interest` counts as 1, except under basis 1, where its actual length can differ from its length as
   * `couponPeriodLength` gives it.
   *
   * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
   * @param {number} issue - the issue date serial
   * @param {number} issuePeriod - the index of the issue's period
   * @param {number} settlement - the settlement date serial
   * @param {number} lastPeriod - the index of the period in which the accrual ends at settlement
   */
  private accrualFromIssue(schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, lastPeriod: number): number {
    const firstInterestPeriodLength = this.couponPeriodLength(schedule, FIRST_INTEREST_PERIOD)
    if (issuePeriod >= lastPeriod) {
      return this.accruedDays(schedule, issue, settlement) / firstInterestPeriodLength
    }
    let periods = this.issuePeriodPart(schedule, issue, issuePeriod)
      + this.accruedDays(schedule, this.quasiCouponDate(schedule, lastPeriod), settlement) / firstInterestPeriodLength
    for (let period = issuePeriod + 1; period < lastPeriod; period++) {
      periods += this.wholePeriod(schedule, period)
    }
    return periods
  }

  /**
   * Returns the accrued coupon periods for a settlement in a period before `first_interest`'s: the time from issue to
   * `first_interest` minus the time from settlement to `first_interest`, both in periods of `first_interest`'s
   * length, grouped as Excel adds them. The days from settlement to `first_interest` are the rest of the settlement's
   * period (of the length `settlementPeriodLength` gives) plus the later periods: 360 / `frequency` days each under
   * bases 0 and 4, their actual days under the other bases. The lengths of the periods in between cancel out, so this
   * takes constant time.
   *
   * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
   * @param {number} issue - the issue date serial
   * @param {number} issuePeriod - the index of the issue's period
   * @param {number} settlement - the settlement date serial
   * @param {number} settlementPeriod - the index of the settlement's period, before `first_interest`'s
   */
  private accrualBeforeFirstInterestPeriod(schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, settlementPeriod: number): number {
    const {basis, frequency} = schedule
    const daysAfterSettlementPeriod = basis === 0 || basis === 4
      ? (FIRST_INTEREST_PERIOD - settlementPeriod) * 360 / frequency
      : this.quasiCouponDate(schedule, 0) - this.quasiCouponDate(schedule, settlementPeriod + 1)
    const daysToFirstInterest = this.settlementPeriodLength(schedule, issuePeriod, settlementPeriod)
      - this.accruedDays(schedule, this.quasiCouponDate(schedule, settlementPeriod), settlement) + daysAfterSettlementPeriod
    return this.issuePeriodPart(schedule, issue, issuePeriod)
      + ((FIRST_INTEREST_PERIOD - issuePeriod) - daysToFirstInterest / this.couponPeriodLength(schedule, FIRST_INTEREST_PERIOD))
  }

  /**
   * Returns the accrued coupon periods with `calc_method` FALSE when issue and settlement are in different periods
   * and settlement is on or before `first_interest`: the issue's partial period (none when issue is on a coupon date),
   * plus the settlement's partial period over its length, minus the whole periods from the settlement's period to
   * `first_interest`. The result can be negative.
   *
   * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
   * @param {number} issue - the issue date serial
   * @param {number} issuePeriod - the index of the issue's period
   * @param {number} settlement - the settlement date serial
   * @param {number} settlementPeriod - the index of the settlement's period, not after `first_interest`'s
   */
  private partialPeriodsBeforeFirstInterest(schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, settlementPeriod: number): number {
    const issuePart = this.quasiCouponDate(schedule, issuePeriod) === issue ? 0 : this.issuePeriodPart(schedule, issue, issuePeriod)
    const settlementPart = this.accruedDays(schedule, this.quasiCouponDate(schedule, settlementPeriod), settlement)
      / this.couponPeriodLength(schedule, settlementPeriod)
    return issuePart + settlementPart - (FIRST_INTEREST_PERIOD - settlementPeriod)
  }

  /**
   * Returns the part of the issue's period from issue to the next coupon date, over the period's length:
   * `issuePeriodLength` when the period is before `first_interest`'s, `couponPeriodLength` otherwise. An issue on a
   * coupon date gives a whole period (`wholePeriod`).
   *
   * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
   * @param {number} issue - the issue date serial
   * @param {number} issuePeriod - the index of the issue's period
   */
  private issuePeriodPart(schedule: QuasiCouponSchedule, issue: number, issuePeriod: number): number {
    if (this.quasiCouponDate(schedule, issuePeriod) === issue) {
      return this.wholePeriod(schedule, issuePeriod)
    }
    const length = issuePeriod < FIRST_INTEREST_PERIOD
      ? this.issuePeriodLength(schedule, issuePeriod)
      : this.couponPeriodLength(schedule, issuePeriod)
    return this.accruedDays(schedule, issue, this.quasiCouponDate(schedule, issuePeriod + 1)) / length
  }

  /**
   * Returns a whole period in coupon periods: 1, except for a period after `first_interest` under basis 1, which is
   * its actual length over its length as `couponPeriodLength` gives it. The two lengths differ only when the period's
   * end rolls over (`periodEndRollsOver`), so the date arithmetic is skipped for every other period.
   */
  private wholePeriod(schedule: QuasiCouponSchedule, period: number): number {
    if (period < 0 || schedule.basis !== 1 || !this.periodEndRollsOver(schedule, period)) {
      return 1
    }
    const actualLength = this.quasiCouponDate(schedule, period + 1) - this.quasiCouponDate(schedule, period)
    return actualLength / this.couponPeriodLength(schedule, period)
  }

  /**
   * Returns true when `rolledOverPeriodEnd` is after the coupon date that ends `period`: `first_interest` is not the
   * last day of its month and its day does not exist in the month of that coupon date.
   */
  private periodEndRollsOver(schedule: QuasiCouponSchedule, period: number): boolean {
    const {firstInterest, frequency} = schedule
    const end = offsetMonth(firstInterest, (period + 1) * 12 / frequency)
    return !this.isMonthEnd(firstInterest) && firstInterest.day > this.dateTimeHelper.daysInMonth(end.year, end.month)
  }

  /**
   * Returns the length in days of a period that is not the issue's period before `first_interest`'s: 360 /
   * `frequency` under bases 0, 2 and 4, 365 / `frequency` under basis 3, and under basis 1 the days from the period
   * start to `rolledOverPeriodEnd`.
   */
  private couponPeriodLength(schedule: QuasiCouponSchedule, period: number): number {
    switch (schedule.basis) {
      case 1:
        return this.rolledOverPeriodEnd(schedule, period) - this.quasiCouponDate(schedule, period)
      case 3:
        return 365 / schedule.frequency
      default:
        return 360 / schedule.frequency
    }
  }

  /**
   * Returns the length in days of the issue's period when it is before `first_interest`'s. Under bases 0 and 2, the
   * US 30/360 days (`days360`) from the period start to `rolledOverPeriodEnd`; under basis 4, the European 30/360
   * days to the date with `first_interest`'s day in the month of the next coupon date, even when that day does not
   * exist (30 February counts as day 30); under bases 1 and 3, `couponPeriodLength`.
   */
  private issuePeriodLength(schedule: QuasiCouponSchedule, period: number): number {
    const {firstInterest, frequency} = schedule
    const start = couponDate(this.dateTimeHelper, firstInterest, period, frequency)
    switch (schedule.basis) {
      case 0:
      case 2:
        return this.days360(start, this.dateTimeHelper.numberToSimpleDate(this.rolledOverPeriodEnd(schedule, period)))
      case 4: {
        const next = couponDate(this.dateTimeHelper, firstInterest, period + 1, frequency)
        const end = {...next, day: this.isMonthEnd(firstInterest) ? next.day : firstInterest.day}
        return daysIn30DayMonths(toBasisEU(start), toBasisEU(end))
      }
      default:
        return this.couponPeriodLength(schedule, period)
    }
  }

  /**
   * Returns the length in days that Excel uses for the settlement's period when settlement is in a period before
   * `first_interest`'s: the days to the next coupon date when issue is in the same period (US 30/360 under bases 0
   * and 2, European 30/360 under basis 4, actual under basis 1, 365 / `frequency` under basis 3), and
   * `issuePeriodLength` otherwise.
   */
  private settlementPeriodLength(schedule: QuasiCouponSchedule, issuePeriod: number, settlementPeriod: number): number {
    if (issuePeriod !== settlementPeriod) {
      return this.issuePeriodLength(schedule, settlementPeriod)
    }
    const {firstInterest, frequency} = schedule
    switch (schedule.basis) {
      case 0:
      case 2:
        return this.days360(couponDate(this.dateTimeHelper, firstInterest, settlementPeriod, frequency), couponDate(this.dateTimeHelper, firstInterest, settlementPeriod + 1, frequency))
      case 3:
        return 365 / frequency
      default:
        return this.accruedDays(schedule, this.quasiCouponDate(schedule, settlementPeriod), this.quasiCouponDate(schedule, settlementPeriod + 1))
    }
  }

  /**
   * Returns the date serial of the day with `first_interest`'s day of the month in the month of the coupon date that
   * ends `period`, rolled over into the next month when that month is shorter (for `first_interest` on 30 August,
   * "30 February 2008" is 1 March 2008). A month-end `first_interest` gives the coupon date itself.
   */
  private rolledOverPeriodEnd(schedule: QuasiCouponSchedule, period: number): number {
    const {firstInterest, frequency} = schedule
    const next = couponDate(this.dateTimeHelper, firstInterest, period + 1, frequency)
    const day = this.isMonthEnd(firstInterest) ? next.day : firstInterest.day
    return this.dateTimeHelper.dateToNumber(next) + day - next.day
  }

  /**
   * Counts the days from `start` to `end` with the US (NASD) 30/360 method as Microsoft documents it for Excel's
   * DAYS360: a start date on the last day of its month counts as day 30; an end date on the last day of its month
   * counts as the 1st of the next month when the start day is below 30, and as day 30 otherwise.
   */
  private days360(start: SimpleDate, end: SimpleDate): number {
    const adjustedStart = {...start, day: this.isMonthEnd(start) ? 30 : start.day}
    if (!this.isMonthEnd(end)) {
      return daysIn30DayMonths(adjustedStart, end)
    }
    const adjustedEnd = adjustedStart.day < 30 ? {...offsetMonth(end, 1), day: 1} : {...end, day: 30}
    return daysIn30DayMonths(adjustedStart, adjustedEnd)
  }

  /**
   * Returns the days from `start` to `end` counted by the schedule's basis.
   */
  private accruedDays(schedule: QuasiCouponSchedule, start: number, end: number): number {
    return this.dateTimeHelper.dayCountByBasis(start, end, schedule.basis).dayCount
  }

  /**
   * Returns the date serial of the coupon date `period` periods after `first_interest` (before it when negative).
   */
  private quasiCouponDate(schedule: QuasiCouponSchedule, period: number): number {
    return this.dateTimeHelper.dateToNumber(couponDate(this.dateTimeHelper, schedule.firstInterest, period, schedule.frequency))
  }

  /**
   * Returns true when `date` is the last day of its month.
   */
  private isMonthEnd(date: SimpleDate): boolean {
    return date.day === this.dateTimeHelper.daysInMonth(date.year, date.month)
  }
}
