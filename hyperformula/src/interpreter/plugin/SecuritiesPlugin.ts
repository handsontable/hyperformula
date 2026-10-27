/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {
  actualCouponPeriodLength,
  buildCouponSchedule,
  CouponSchedule,
  daysBeforeSettlement,
  settlementPeriod,
  thirtyDayPeriodLength,
} from './CouponSchedule'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Holds the securities functions, which compute a security's price, yield, duration, discount or interest rate, amount
 * received, accrued interest, or coupon dates and periods from its dates and a day-count basis.
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
    'DURATION': {
      method: 'duration',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR, defaultValue: 0},
      ],
    },
    'PRICE': {
      method: 'price',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
        {argumentType: FunctionArgumentType.SCALAR},
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
   * Corresponds to DURATION(settlement, maturity, coupon, yld, frequency, [basis]).
   *
   * Returns the Macaulay duration, in years, of a security that pays periodic interest, for a par value of $100.
   * Arguments are validated from left to right, as in Excel: settlement and maturity (error, #VALUE!, date range),
   * coupon and yld (error, #VALUE!), frequency (error, #VALUE!, 1, 2 or 4) and basis (error, #VALUE!, 0 to 4), each in
   * turn; then settlement before maturity and `coupon` and `yld` not negative (#NUM!). An empty argument other than
   * `basis` is #N/A in its own place of that order. A previous coupon date before the earliest supported date is #NUM!.
   *
   * With N coupons left, the coupon c = 100 * `coupon` / `frequency`, v = 1 + `yld` / `frequency`, and the exponent
   * of period k, x_k = (k + DSC / E) - 1 (see `settlementPeriod`), each coupon's present value is c / v^x_k, plus
   * 100 / v^x_N for the redemption at maturity, and the duration is the sum of (x_k / `frequency`) times the present
   * value of period k, divided by the sum of the present values. A discount factor v^x_k too large for a number is
   * #NUM!.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public duration(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DURATION'),
      (settlementArg: InternalScalarValue, maturityArg: InternalScalarValue, couponArg: InternalScalarValue, yldArg: InternalScalarValue, frequencyArg: InternalScalarValue, basisArg: InternalScalarValue) => {
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
        if (this.isArgumentEmpty(ast, 2)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const coupon = this.strictNumber(couponArg)
        if (coupon instanceof CellError) {
          return coupon
        }
        if (this.isArgumentEmpty(ast, 3)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const yld = this.strictNumber(yldArg)
        if (yld instanceof CellError) {
          return yld
        }
        if (this.isArgumentEmpty(ast, 4)) {
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
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (coupon < 0 || yld < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        const schedule = buildCouponSchedule(this.dateTimeHelper, settlement, maturity, frequency, basis)
        if (schedule instanceof CellError) {
          return schedule
        }
        const {couponCount, periodDays, daysToNextCoupon} = settlementPeriod(this.dateTimeHelper, schedule)
        const payment = 100 * coupon / frequency
        const discountBase = 1 + yld / frequency
        const periodFraction = daysToNextCoupon / periodDays
        let weightedPresentValues = 0
        let presentValues = 0
        for (let period = 1; period <= couponCount; period++) {
          const exponent = (period + periodFraction) - 1
          const discountFactor = Math.pow(discountBase, exponent)
          if (!Number.isFinite(discountFactor)) {
            return new CellError(ErrorType.NUM, ErrorMessage.NaN)
          }
          const cashFlow = period === couponCount ? payment + 100 : payment
          const presentValue = cashFlow / discountFactor
          weightedPresentValues += exponent / frequency * presentValue
          presentValues += presentValue
        }
        return weightedPresentValues / presentValues
      }
    )
  }

  /**
   * Corresponds to PRICE(settlement, maturity, rate, yld, redemption, frequency, [basis]).
   *
   * Returns the price per $100 face value of a security that pays periodic interest. Arguments are validated in
   * Excel's order: basis (error, #VALUE!, 0 to 4) first, then settlement and maturity (error, #VALUE!, date range),
   * rate, yld and redemption (error, #VALUE!) and frequency (error, #VALUE!, 1, 2 or 4), each in turn; then
   * settlement before maturity, `rate` and `yld` not negative and `redemption` greater than 0 (#NUM!). An empty
   * argument other than `basis` is #N/A in its own place of that order. A previous coupon date before the earliest
   * supported date is #NUM!.
   *
   * With N coupons left, the coupon c = 100 * `rate` / `frequency`, v = 1 + `yld` / `frequency`, and the exponent of
   * period k, x_k = (k + DSC / E) - 1 (see `settlementPeriod`), the price is the sum of c / v^x_k for k = 1 to N, plus
   * `redemption` / v^x_N, minus the accrued interest c * A / E. With one coupon left (N = 1), it is
   * (c + `redemption`) / (1 + DSC / E * `yld` / `frequency`) - c * A / E. A large `yld` can give a negative price; a
   * discount factor v^x_k too large for a number is #NUM!.
   *
   * @param {ProcedureAst} ast - the function's AST
   * @param {InterpreterState} state - the interpreter state
   */
  public price(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PRICE'),
      (settlementArg: InternalScalarValue, maturityArg: InternalScalarValue, rateArg: InternalScalarValue, yldArg: InternalScalarValue, redemptionArg: InternalScalarValue, frequencyArg: InternalScalarValue, basisArg: InternalScalarValue) => {
        const basis = this.coerceToDayCountBasis(basisArg)
        if (basis instanceof CellError) {
          return basis
        }
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
        if (this.isArgumentEmpty(ast, 2)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const rate = this.strictNumber(rateArg)
        if (rate instanceof CellError) {
          return rate
        }
        if (this.isArgumentEmpty(ast, 3)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const yld = this.strictNumber(yldArg)
        if (yld instanceof CellError) {
          return yld
        }
        if (this.isArgumentEmpty(ast, 4)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const redemption = this.strictNumber(redemptionArg)
        if (redemption instanceof CellError) {
          return redemption
        }
        if (this.isArgumentEmpty(ast, 5)) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyArg)
        }
        const frequency = this.coerceToCouponFrequency(frequencyArg)
        if (frequency instanceof CellError) {
          return frequency
        }
        if (settlement >= maturity) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (rate < 0 || yld < 0 || redemption <= 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
        }
        const schedule = buildCouponSchedule(this.dateTimeHelper, settlement, maturity, frequency, basis)
        if (schedule instanceof CellError) {
          return schedule
        }
        const {couponCount, daysFromPeriodStart, periodDays, daysToNextCoupon} = settlementPeriod(this.dateTimeHelper, schedule)
        const payment = 100 * rate / frequency
        const accruedInterest = payment * daysFromPeriodStart / periodDays
        const periodFraction = daysToNextCoupon / periodDays
        if (couponCount === 1) {
          return (payment + redemption) / (1 + periodFraction * yld / frequency) - accruedInterest
        }
        const discountBase = 1 + yld / frequency
        let price = 0
        for (let period = 1; period <= couponCount; period++) {
          const discountFactor = Math.pow(discountBase, (period + periodFraction) - 1)
          if (!Number.isFinite(discountFactor)) {
            return new CellError(ErrorType.NUM, ErrorMessage.NaN)
          }
          price += payment / discountFactor
        }
        price += redemption / Math.pow(discountBase, (couponCount + periodFraction) - 1)
        return price - accruedInterest
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
        const schedule = buildCouponSchedule(this.dateTimeHelper, settlement, maturity, frequency, basis)
        if (schedule instanceof CellError) {
          return schedule
        }
        return calculate(schedule)
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
}
