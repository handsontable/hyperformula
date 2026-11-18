/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {DateTimeHelper, daysIn30DayMonths, offsetMonth, SimpleDate, toBasisEU} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'

/**
 * The coupon schedule of a coupon function call, built once from its validated arguments.
 */
export interface CouponSchedule {
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
 * Returns the coupon date `periods` coupon periods after `anchor` (before it when negative). The date is computed
 * from the anchor directly, so the day of the month never drifts: if the anchor is the last day of its month, so is
 * the result; otherwise the result keeps the anchor's day, clamped to the length of its month (leap years included).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} anchor - the coupon date the others are counted from
 * @param {number} periods - the number of coupon periods to step, negative to step back
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
export function couponDate(dateTimeHelper: DateTimeHelper, anchor: SimpleDate, periods: number, frequency: number): SimpleDate {
  const {year, month} = offsetMonth(anchor, periods * 12 / frequency)
  const lastDay = dateTimeHelper.daysInMonth(year, month)
  const isAnchorMonthEnd = anchor.day === dateTimeHelper.daysInMonth(anchor.year, anchor.month)
  return {year, month, day: isAnchorMonthEnd ? lastDay : Math.min(anchor.day, lastDay)}
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
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} date - the date serial
 * @param {SimpleDate} anchor - the coupon date the schedule is anchored at
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
export function couponPeriodIndex(dateTimeHelper: DateTimeHelper, date: number, anchor: SimpleDate, frequency: number): number {
  const {year, month} = dateTimeHelper.numberToSimpleDate(date)
  const periods = Math.floor((12 * (year - anchor.year) + month - anchor.month) * frequency / 12)
  if (dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, anchor, periods, frequency)) <= date) {
    return periods
  }
  return periods - 1
}

/**
 * Returns the number of days from the previous coupon date to settlement, counted by the schedule's basis.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {CouponSchedule} schedule - the coupon schedule
 */
export function daysBeforeSettlement(dateTimeHelper: DateTimeHelper, schedule: CouponSchedule): number {
  const previous = dateTimeHelper.dateToNumber(schedule.previous)
  return dateTimeHelper.dayCountByBasis(previous, schedule.settlement, schedule.basis).dayCount
}

/**
 * Returns the 30/360 length of the coupon period, from the previous to the next coupon date, as Excel counts it for
 * COUPDAYSNC with basis 0: day 31 and the last day of February count as day 30 at both ends. The two dates are
 * exactly 12 / `frequency` months apart, so only their days change the length (for example 179 days from
 * 28 February to 29 August).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {CouponSchedule} schedule - the coupon schedule
 */
export function thirtyDayPeriodLength(dateTimeHelper: DateTimeHelper, schedule: CouponSchedule): number {
  return 360 / schedule.frequency + thirtyDayMonthDay(dateTimeHelper, schedule.next) - thirtyDayMonthDay(dateTimeHelper, schedule.previous)
}

/**
 * Returns the day of the month of `date` in a 30-day month: 30 for day 31 and for the last day of February,
 * otherwise the day itself.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} date - the date
 */
function thirtyDayMonthDay(dateTimeHelper: DateTimeHelper, date: SimpleDate): number {
  return date.day === 31 || isFebruaryEnd(dateTimeHelper, date) ? 30 : date.day
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
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {CouponSchedule} schedule - the coupon schedule
 */
export function actualCouponPeriodLength(dateTimeHelper: DateTimeHelper, schedule: CouponSchedule): number {
  const {settlement, maturity, frequency, count} = schedule
  let periodEnd = driftedCouponDate(dateTimeHelper, maturity, count - 1, frequency)
  if (count >= 2 && dateTimeHelper.dateToNumber(periodEnd) <= settlement) {
    periodEnd = driftedCouponDate(dateTimeHelper, maturity, count - 2, frequency)
  }
  let periodStart = couponDate(dateTimeHelper, periodEnd, -1, frequency)
  if (dateTimeHelper.dateToNumber(periodStart) > settlement) {
    periodEnd = periodStart
    periodStart = couponDate(dateTimeHelper, periodEnd, -1, frequency)
  }
  return dateTimeHelper.dateToNumber(periodEnd) - dateTimeHelper.dateToNumber(periodStart)
}

/**
 * Returns `maturity` stepped back `periods` coupon periods, each step keeping the previous date's day clamped to the
 * length of its month, so the day can drift down (31 March, 30 September, 30 March).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} maturity - the maturity date
 * @param {number} periods - the number of coupon periods to step back
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
function driftedCouponDate(dateTimeHelper: DateTimeHelper, maturity: SimpleDate, periods: number, frequency: number): SimpleDate {
  return chainedCouponDate(dateTimeHelper, maturity, -periods, frequency, false)
}

/**
 * Returns `start` stepped `periods` coupon periods (back when negative), each step from the date before: the last day
 * of the month when `monthEnd` is true, and otherwise the previous date's day clamped to the length of its month, so
 * the day can drift down (31 March, 30 September, 30 March).
 *
 * Constant time: the drifted day is the smallest of `start`'s day and the lengths of the months visited, and those
 * months repeat every year, so after `2 * frequency` steps (two Februaries, at least one in a non-leap year) the
 * day no longer changes.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} start - the date to step from
 * @param {number} periods - the number of coupon periods to step, negative to step back
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 * @param {boolean} monthEnd - whether every date is the last day of its month
 */
function chainedCouponDate(dateTimeHelper: DateTimeHelper, start: SimpleDate, periods: number, frequency: number, monthEnd: boolean): SimpleDate {
  const monthsPerPeriod = 12 / frequency
  const direction = Math.sign(periods)
  const target = offsetMonth(start, periods * monthsPerPeriod)
  const targetMonthLength = dateTimeHelper.daysInMonth(target.year, target.month)
  if (monthEnd) {
    return {...target, day: targetMonthLength}
  }
  let day = start.day
  for (let step = 1; step <= Math.min(Math.abs(periods), 2 * frequency); step++) {
    const visited = offsetMonth(start, direction * step * monthsPerPeriod)
    day = Math.min(day, dateTimeHelper.daysInMonth(visited.year, visited.month))
  }
  return {...target, day: Math.min(day, targetMonthLength)}
}

/**
 * The quasi-coupon schedule of an ACCRINT call: coupon dates one coupon period apart, counted from `first_interest`.
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
 * Returns the interest that ACCRINT accrues from `issue` to `settlement` in coupon periods (the result divided by
 * `par` * `rate` / `frequency`), as Excel computes it.
 *
 * The accrual starts at the last coupon date before settlement when settlement is after `first_interest` and
 * `calcMethod` is TRUE, and at the coupon date before `first_interest` otherwise. The time from that date (or from
 * `issue`, when later) to settlement counts as days over the length of `first_interest`'s period. When `issue` is
 * before that date, the periods back to `issue` are added one at a time: each whole period counts 1, or 0 when
 * `calcMethod` is FALSE, and `issue`'s own period counts the days from `issue` to its end over that period's length.
 *
 * Coupon dates are stepped one period at a time, each from the one before, keeping `first_interest`'s day clamped to
 * the length of the month (or the last day when `first_interest` is the last day of its month), so a date clamped in
 * February keeps the shorter day afterwards. A coupon date reached before the earliest supported date, or after the
 * latest one, returns #NUM!.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} settlement - the settlement date serial, after `issue`
 * @param {boolean} calcMethod - the `calc_method` argument
 */
export function accruedCouponPeriods(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, settlement: number, calcMethod: boolean): number | CellError {
  const {firstInterest, frequency, basis} = schedule
  const monthEnd = isMonthEnd(dateTimeHelper, firstInterest)
  const step = (date: SimpleDate, periods: number) => chainedCouponDate(dateTimeHelper, date, periods, frequency, monthEnd)
  const previousCoupon = step(firstInterest, -1)

  let accrualStart = previousCoupon
  if (calcMethod && settlement > dateTimeHelper.dateToNumber(firstInterest)) {
    const periodsBefore = lastPeriodBefore(dateTimeHelper, firstInterest, settlement, frequency, step)
    if (dateTimeHelper.getWithinBounds(dateTimeHelper.dateToNumber(step(firstInterest, periodsBefore + 1))) === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    accrualStart = step(firstInterest, periodsBefore)
  }

  const accrualStartSerial = dateTimeHelper.dateToNumber(accrualStart)
  const firstInterestPeriodLength = basis === 1
    ? dateTimeHelper.dateToNumber(firstInterest) - dateTimeHelper.dateToNumber(previousCoupon)
    : yearDays(basis) / frequency
  let periods = daysBetween(dateTimeHelper, basis, Math.max(issue, accrualStartSerial), settlement) / firstInterestPeriodLength

  if (issue >= accrualStartSerial) {
    return accrualStartSerial < 0 ? new CellError(ErrorType.NUM, ErrorMessage.DateBounds) : periods
  }

  const periodsBack = firstPeriodOnOrBefore(dateTimeHelper, accrualStart, issue, frequency, step)
  const issuePeriodStart = step(accrualStart, -periodsBack)
  const issuePeriodStartSerial = dateTimeHelper.dateToNumber(issuePeriodStart)
  const issueOnCouponDate = issuePeriodStartSerial === issue
  if (!issueOnCouponDate && issuePeriodStartSerial < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
  }
  if (calcMethod) {
    const wholePeriods = issueOnCouponDate ? periodsBack : periodsBack - 1
    for (let period = 0; period < wholePeriods; period++) {
      periods += 1
    }
  }
  return issueOnCouponDate
    ? periods
    : periods + issuePeriodPart(dateTimeHelper, schedule, issue, issuePeriodStart, step(accrualStart, 1 - periodsBack))
}

/**
 * Returns the number of coupon periods from `firstInterest` to the last coupon date before `settlement`, which is
 * after `firstInterest`. Constant time: estimated from the months between them, then corrected by a period.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} firstInterest - the first interest date
 * @param {number} settlement - the settlement date serial
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 * @param {Function} step - steps a coupon date by a number of periods
 */
function lastPeriodBefore(dateTimeHelper: DateTimeHelper, firstInterest: SimpleDate, settlement: number, frequency: number, step: (date: SimpleDate, periods: number) => SimpleDate): number {
  const settlementDate = dateTimeHelper.numberToSimpleDate(settlement)
  let periods = Math.max(0, Math.floor(monthsBetween(firstInterest, settlementDate) * frequency / 12))
  while (dateTimeHelper.dateToNumber(step(firstInterest, periods + 1)) < settlement) {
    periods++
  }
  while (periods > 0 && dateTimeHelper.dateToNumber(step(firstInterest, periods)) >= settlement) {
    periods--
  }
  return periods
}

/**
 * Returns the smallest number of coupon periods back from `accrualStart` that reaches a coupon date on or before
 * `issue`, which is before `accrualStart`. Constant time: estimated from the months between them, then corrected by
 * a period.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} accrualStart - the coupon date the accrual starts at
 * @param {number} issue - the issue date serial
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 * @param {Function} step - steps a coupon date by a number of periods
 */
function firstPeriodOnOrBefore(dateTimeHelper: DateTimeHelper, accrualStart: SimpleDate, issue: number, frequency: number, step: (date: SimpleDate, periods: number) => SimpleDate): number {
  const issueDate = dateTimeHelper.numberToSimpleDate(issue)
  let periods = Math.max(1, Math.ceil(monthsBetween(issueDate, accrualStart) * frequency / 12))
  while (dateTimeHelper.dateToNumber(step(accrualStart, -periods)) > issue) {
    periods++
  }
  while (periods > 1 && dateTimeHelper.dateToNumber(step(accrualStart, 1 - periods)) <= issue) {
    periods--
  }
  return periods
}

/**
 * Returns the number of months from `start`'s month to `end`'s month.
 *
 * @param {SimpleDate} start - the start date
 * @param {SimpleDate} end - the end date
 */
function monthsBetween(start: SimpleDate, end: SimpleDate): number {
  return 12 * (end.year - start.year) + end.month - start.month
}

/**
 * Returns the part of `issue`'s coupon period that ACCRINT accrues: the days from `issue` to the period's end over the
 * period's length. Bases 0, 2 and 4 count the length in 30-day months, US for 0 and 2 (with the last day of February
 * and the 31st counted as the 30th at both ends) and European for 4; basis 1 counts its actual days, and basis 3 is
 * 365 / frequency.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial, inside the period
 * @param {SimpleDate} periodStart - the coupon date that starts the period
 * @param {SimpleDate} periodEnd - the coupon date that ends the period
 */
function issuePeriodPart(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, periodStart: SimpleDate, periodEnd: SimpleDate): number {
  const periodEndSerial = dateTimeHelper.dateToNumber(periodEnd)
  const days = daysBetween(dateTimeHelper, schedule.basis, issue, periodEndSerial)
  switch (schedule.basis) {
    case 0:
    case 2:
      return days / daysIn30DayMonths(
        {...periodStart, day: thirtyDayMonthDay(dateTimeHelper, periodStart)},
        {...periodEnd, day: thirtyDayMonthDay(dateTimeHelper, periodEnd)},
      )
    case 4:
      return days / daysIn30DayMonths(toBasisEU(periodStart), toBasisEU(periodEnd))
    case 1:
      return days / (periodEndSerial - dateTimeHelper.dateToNumber(periodStart))
    default:
      return days / (365 / schedule.frequency)
  }
}

/**
 * Returns the days from `start` to `end` that ACCRINT accrues under `basis`: US 30/360 for basis 0, European 30/360
 * for basis 4, and actual days otherwise.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} basis - the day-count basis: 0 to 4
 * @param {number} start - the start date serial
 * @param {number} end - the end date serial
 */
function daysBetween(dateTimeHelper: DateTimeHelper, basis: number, start: number, end: number): number {
  if (basis === 0) {
    const [adjustedStart, adjustedEnd] = dateTimeHelper.toBasisUS(dateTimeHelper.numberToSimpleDate(start), dateTimeHelper.numberToSimpleDate(end))
    return daysIn30DayMonths(adjustedStart, adjustedEnd)
  }
  if (basis === 4) {
    return daysIn30DayMonths(toBasisEU(dateTimeHelper.numberToSimpleDate(start)), toBasisEU(dateTimeHelper.numberToSimpleDate(end)))
  }
  return end - start
}

/**
 * Returns the days of a year under `basis` that a coupon period's length is a fraction of: 365 for basis 3, 360
 * otherwise. Basis 1 periods are measured in actual days instead.
 *
 * @param {number} basis - the day-count basis: 0 to 4
 */
function yearDays(basis: number): number {
  return basis === 3 ? 365 : 360
}

/**
 * Returns true when `date` is the last day of its month.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} date - the date
 */
function isMonthEnd(dateTimeHelper: DateTimeHelper, date: SimpleDate): boolean {
  return date.day === dateTimeHelper.daysInMonth(date.year, date.month)
}

/**
 * The validated arguments of an ODDFPRICE call: dates as serials, `issue` < `settlement` < `firstCoupon` <
 * `maturity`.
 */
export interface OddFirstPeriodBond {
  /** The settlement date serial. */
  settlement: number,
  /** The maturity date serial. */
  maturity: number,
  /** The issue date serial. */
  issue: number,
  /** The first coupon date serial. */
  firstCoupon: number,
  /** The annual coupon rate, not negative. */
  rate: number,
  /** The annual yield, not negative. */
  yld: number,
  /** The redemption value per 100 face value, greater than 0. */
  redemption: number,
  /** The number of coupons per year: 1, 2 or 4. */
  frequency: number,
  /** The day-count basis: 0 to 4. */
  basis: number,
}

/**
 * The validated arguments of an ODDLPRICE call: dates as serials, `lastInterest` < `settlement` < `maturity`.
 */
export interface OddLastPeriodBond {
  /** The settlement date serial. */
  settlement: number,
  /** The maturity date serial. */
  maturity: number,
  /** The last coupon date serial. */
  lastInterest: number,
  /** The annual coupon rate, not negative. */
  rate: number,
  /** The annual yield, not negative. */
  yld: number,
  /** The redemption value per 100 face value, greater than 0. */
  redemption: number,
  /** The number of coupons per year: 1, 2 or 4. */
  frequency: number,
  /** The day-count basis: 0 to 4. */
  basis: number,
}

/**
 * Returns the price per 100 face value of a bond with an odd first coupon period, as Excel's ODDFPRICE computes it.
 *
 * The regular coupons are those of `maturity`'s schedule (`couponDate`), and `firstCoupon` must be one of them. The
 * quasi-coupon period that contains settlement is the period of `firstCoupon`'s schedule around it; E is its length:
 * the days from its start to its end under basis 1, 365 / `frequency` under basis 3, 360 / `frequency` otherwise.
 * DFC, the days from issue to the first coupon, decides the formula: shorter than E, the short first period of
 * `shortFirstPeriodPrice`; longer, the long one of `longFirstPeriodPrice`; equal, #NUM!, as in Excel.
 *
 * Takes O(n) time in the number of coupons and quasi-coupon periods.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {OddFirstPeriodBond} bond - the validated arguments
 */
export function oddFirstPeriodPrice(dateTimeHelper: DateTimeHelper, bond: OddFirstPeriodBond): number | CellError {
  const {settlement, maturity, issue, firstCoupon, frequency, basis} = bond
  const maturityDate = dateTimeHelper.numberToSimpleDate(maturity)
  const couponCount = -couponPeriodIndex(dateTimeHelper, firstCoupon, maturityDate, frequency)
  if (dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, maturityDate, -couponCount, frequency)) !== firstCoupon) {
    return new CellError(ErrorType.NUM, ErrorMessage.FirstCouponDate)
  }
  const firstCouponDate = dateTimeHelper.numberToSimpleDate(firstCoupon)
  const settlementPeriod = couponPeriodIndex(dateTimeHelper, settlement, firstCouponDate, frequency)
  const periodStart = dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, firstCouponDate, settlementPeriod, frequency))
  if (periodStart < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
  }
  const periodEnd = dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, firstCouponDate, settlementPeriod + 1, frequency))
  const periodDays = basis === 1 ? periodEnd - periodStart : (basis === 3 ? 365 : 360) / frequency
  const firstPeriodDays = dayCount(dateTimeHelper, issue, firstCoupon, basis)
  if (firstPeriodDays === periodDays) {
    return new CellError(ErrorType.NUM, ErrorMessage.OddPeriodLength)
  }
  if (firstPeriodDays < periodDays) {
    const settlementCoupons = -couponPeriodIndex(dateTimeHelper, settlement, maturityDate, frequency)
    return shortFirstPeriodPrice(dateTimeHelper, bond, settlementCoupons, periodDays, firstPeriodDays)
  }
  return longFirstPeriodPrice(dateTimeHelper, bond, couponCount, periodDays, periodStart, periodEnd)
}

/**
 * Returns ODDFPRICE's price for a short first period, with the terms of Microsoft's formula: A, the days from issue to
 * settlement; DSC, from settlement to the first coupon; DFC, from issue to the first coupon; E, the quasi-coupon
 * period length; N, the coupons of maturity's schedule after settlement. N is one more than the coupons from the
 * first coupon to maturity when a quasi-coupon date falls between settlement and the first coupon, as Excel counts
 * it. The terms are added in Excel's order: redemption,
 * first coupon, the other coupons, then the accrued interest subtracted; that order gives Excel's last digit.
 *
 * #NUM! when a discount factor is not finite (a large `yld` over many periods).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {OddFirstPeriodBond} bond - the validated arguments
 * @param {number} settlementCoupons - N, the coupons of maturity's schedule after settlement
 * @param {number} periodDays - E
 * @param {number} firstPeriodDays - DFC
 */
function shortFirstPeriodPrice(dateTimeHelper: DateTimeHelper, bond: OddFirstPeriodBond, settlementCoupons: number, periodDays: number, firstPeriodDays: number): number | CellError {
  const {settlement, issue, firstCoupon, rate, yld, redemption, frequency, basis} = bond
  const payment = 100 * rate / frequency
  const discountBase = yld / frequency + 1
  const periodFraction = dayCount(dateTimeHelper, settlement, firstCoupon, basis) / periodDays
  const redemptionFactor = Math.pow(discountBase, (settlementCoupons - 1) + periodFraction)
  if (!Number.isFinite(redemptionFactor)) {
    return new CellError(ErrorType.NUM, ErrorMessage.NaN)
  }
  let coupons = 0
  for (let coupon = 2; coupon <= settlementCoupons; coupon++) {
    coupons = coupons + payment / Math.pow(discountBase, (coupon - 1) + periodFraction)
  }
  const accrued = dayCount(dateTimeHelper, issue, settlement, basis) / periodDays * (rate / frequency) * 100
  return redemption / redemptionFactor + payment * firstPeriodDays / periodDays / Math.pow(discountBase, periodFraction) + coupons - accrued
}

/**
 * Returns ODDFPRICE's price for a long first period, with the terms of Microsoft's formula. The quasi-coupon periods
 * of the first period are stepped back from the first coupon by `stepMonths`, so their day can drift down (31
 * August, 28 February, 28 August), and their number NC is the number of coupon dates of `firstCoupon`'s schedule
 * after issue. For each, from the latest: NL, its length (its days under basis 1, E otherwise); DC, its coupon days
 * (NL, or for the earliest the days from issue to its end, 0 if issue is after it); A, its accrued days (from issue
 * or its start to settlement or its end, 0 if none). DSC is E minus the days from the start of settlement's
 * quasi-coupon period to settlement (bases 0, 1 and 4) or the days from settlement to its end (bases 2 and 3). Nq is
 * `quasiCouponsBeforeFirstCoupon`. The terms are added in Excel's order, as in `shortFirstPeriodPrice`.
 *
 * #NUM! when a quasi-coupon date stepped back is before the earliest supported date (Excel too: the stepped dates
 * drift below the coupon dates), or a discount factor is not finite.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {OddFirstPeriodBond} bond - the validated arguments
 * @param {number} couponCount - the regular coupons after the first coupon, up to and including maturity
 * @param {number} periodDays - E
 * @param {number} periodStart - the start of settlement's quasi-coupon period, a date serial
 * @param {number} periodEnd - the end of settlement's quasi-coupon period, a date serial
 */
function longFirstPeriodPrice(dateTimeHelper: DateTimeHelper, bond: OddFirstPeriodBond, couponCount: number, periodDays: number, periodStart: number, periodEnd: number): number | CellError {
  const {settlement, issue, firstCoupon, rate, yld, redemption, frequency, basis} = bond
  const firstCouponDate = dateTimeHelper.numberToSimpleDate(firstCoupon)
  const issuePeriod = couponPeriodIndex(dateTimeHelper, issue, firstCouponDate, frequency)
  let couponPeriods = 0
  let accruedPeriods = 0
  let periodEndDate = firstCouponDate
  for (let period = -issuePeriod; period >= 1; period--) {
    const periodStartDate = stepMonths(dateTimeHelper, periodEndDate, -12 / frequency)
    const start = dateTimeHelper.dateToNumber(periodStartDate)
    if (start < 0) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    const end = dateTimeHelper.dateToNumber(periodEndDate)
    const normalLength = basis === 1 ? end - start : periodDays
    const couponDays = period > 1 ? normalLength : daysIfForward(dateTimeHelper, issue, end, basis)
    couponPeriods += couponDays / normalLength
    accruedPeriods += daysIfForward(dateTimeHelper, Math.max(issue, start), Math.min(settlement, end), basis) / normalLength
    periodEndDate = periodStartDate
  }
  const daysToPeriodEnd = basis === 2 || basis === 3
    ? dayCount(dateTimeHelper, settlement, periodEnd, basis)
    : periodDays - dayCount(dateTimeHelper, periodStart, settlement, basis)
  const quasiCoupons = quasiCouponsBeforeFirstCoupon(dateTimeHelper, dateTimeHelper.numberToSimpleDate(settlement), firstCouponDate, frequency)
  const periodFraction = daysToPeriodEnd / periodDays
  const discountBase = yld / frequency + 1
  const redemptionFactor = Math.pow(discountBase, periodFraction + quasiCoupons + couponCount)
  if (!Number.isFinite(redemptionFactor)) {
    return new CellError(ErrorType.NUM, ErrorMessage.NaN)
  }
  const payment = 100 * rate / frequency
  let coupons = 0
  for (let coupon = 1; coupon <= couponCount; coupon++) {
    coupons = coupons + payment / Math.pow(discountBase, coupon + quasiCoupons + periodFraction)
  }
  return redemption / redemptionFactor + payment * couponPeriods / Math.pow(discountBase, quasiCoupons + periodFraction) + coupons - payment * accruedPeriods
}

/**
 * Returns Nq, the number of quasi-coupon periods by which ODDFPRICE discounts the first coupon, counted as Excel
 * counts it: from settlement, or from the last day of settlement's month when the dates step by month ends, step
 * forward by the coupon period until `firstCoupon` is reached; each step counts, plus one when settlement was moved
 * to its month end. The dates step by month ends when `firstCoupon` is the last day of its month, or is the 29th or
 * 30th of a month other than February and settlement is the last day of its month. With a month-end first coupon and
 * settlement in its last quasi-coupon period, not on a month end, Nq is one more than the whole periods between
 * the two dates.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} settlement - the settlement date
 * @param {SimpleDate} firstCoupon - the first coupon date
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
function quasiCouponsBeforeFirstCoupon(dateTimeHelper: DateTimeHelper, settlement: SimpleDate, firstCoupon: SimpleDate, frequency: number): number {
  const byMonthEnds = isMonthEnd(dateTimeHelper, firstCoupon)
    || (firstCoupon.month !== 2 && firstCoupon.day > 28 && isMonthEnd(dateTimeHelper, settlement))
  const step = (date: SimpleDate) => byMonthEnds
    ? dateTimeHelper.endOfMonth(offsetMonth(date, 12 / frequency))
    : stepMonths(dateTimeHelper, date, 12 / frequency)
  const start = byMonthEnds ? dateTimeHelper.endOfMonth(settlement) : settlement
  const end = dateTimeHelper.dateToNumber(firstCoupon)
  let count = start.day === settlement.day ? 0 : 1
  for (let date = step(start); dateTimeHelper.dateToNumber(date) < end; date = step(date)) {
    count++
  }
  return count
}

/**
 * Returns the price per 100 face value of a bond with an odd last coupon period, as Excel's ODDLPRICE computes it:
 * (redemption + DC * payment) / (1 + DSC * yld / frequency) - A * payment, with payment = 100 * rate / frequency and
 * DC, A and DSC summed over the quasi-coupon periods of the last period, each as days over the period's length NL.
 *
 * The quasi-coupon periods are stepped forward from `lastInterest` by `stepMonths`, so their day can drift down, and
 * their number NC is the number of coupon dates of `maturity`'s schedule after `lastInterest`. For each: NL,
 * `periodLength` from its start to its end; DC, NL, or for the last one NL minus `periodLength` from maturity to its
 * end; A, DC for a period that ends before settlement, the days from its start to settlement for the one that
 * contains settlement, 0 after it; DSC, the days from settlement or its start to maturity or its end, 0 if none.
 * A, DSC and the other day counts follow `dayCountByBasis`.
 *
 * Takes O(NC) time. #NUM! when the coupon date of `maturity`'s schedule on or before `lastInterest` is before the
 * earliest supported date, or a quasi-coupon date is after the latest one.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {OddLastPeriodBond} bond - the validated arguments
 */
export function oddLastPeriodPrice(dateTimeHelper: DateTimeHelper, bond: OddLastPeriodBond): number | CellError {
  const {settlement, maturity, lastInterest, rate, yld, redemption, frequency, basis} = bond
  const maturityDate = dateTimeHelper.numberToSimpleDate(maturity)
  const lastInterestPeriod = couponPeriodIndex(dateTimeHelper, lastInterest, maturityDate, frequency)
  if (dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, maturityDate, lastInterestPeriod, frequency)) < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
  }
  let couponPeriods = 0
  let accruedPeriods = 0
  let periodsToMaturity = 0
  let periodStartDate = dateTimeHelper.numberToSimpleDate(lastInterest)
  for (let period = 1; period <= -lastInterestPeriod; period++) {
    const periodEndDate = stepMonths(dateTimeHelper, periodStartDate, 12 / frequency)
    const start = dateTimeHelper.dateToNumber(periodStartDate)
    const end = dateTimeHelper.dateToNumber(periodEndDate)
    if (dateTimeHelper.getWithinBounds(end) === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    const normalLength = periodLength(dateTimeHelper, start, end, basis)
    const couponDays = period < -lastInterestPeriod ? normalLength : normalLength - periodLength(dateTimeHelper, maturity, end, basis)
    let accruedDays = 0
    if (end < settlement) {
      accruedDays = couponDays
    } else if (start < settlement) {
      accruedDays = dayCount(dateTimeHelper, start, settlement, basis)
    }
    couponPeriods += couponDays / normalLength
    accruedPeriods += accruedDays / normalLength
    periodsToMaturity += daysIfForward(dateTimeHelper, Math.max(settlement, start), Math.min(maturity, end), basis) / normalLength
    periodStartDate = periodEndDate
  }
  const payment = 100 * rate / frequency
  const price = (couponPeriods * payment + redemption) / (periodsToMaturity * yld / frequency + 1) - accruedPeriods * payment
  return Number.isFinite(price) ? price : new CellError(ErrorType.NUM, ErrorMessage.NaN)
}

/**
 * Returns the length in days of a quasi-coupon period of ODDLPRICE, from `start` to `end` (or, reversed, the days
 * from maturity to the period's end): `dayCountByBasis`, except under basis 0, where Excel counts both dates with
 * `thirtyDayMonthDay` (the 31st and the last day of February are day 30, at either end), as for COUPDAYSNC's period
 * length.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} start - the start date serial
 * @param {number} end - the end date serial
 * @param {number} basis - the day-count basis: 0 to 4
 */
function periodLength(dateTimeHelper: DateTimeHelper, start: number, end: number, basis: number): number {
  if (basis !== 0) {
    return dayCount(dateTimeHelper, start, end, basis)
  }
  const startDate = dateTimeHelper.numberToSimpleDate(start)
  const endDate = dateTimeHelper.numberToSimpleDate(end)
  return daysIn30DayMonths({...startDate, day: thirtyDayMonthDay(dateTimeHelper, startDate)}, {...endDate, day: thirtyDayMonthDay(dateTimeHelper, endDate)})
}

/**
 * Returns `date` moved by `months` months, its day clamped to the length of the month it lands in. Stepping from
 * one date to the next this way, as Excel's odd-period functions do, the day can only drift down (31 August,
 * 28 February, 28 August), unlike `couponDate`, which counts every date from its anchor.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} date - the date to move
 * @param {number} months - the number of months, negative to move back
 */
function stepMonths(dateTimeHelper: DateTimeHelper, date: SimpleDate, months: number): SimpleDate {
  return dateTimeHelper.truncateDayInMonth(offsetMonth(date, months))
}

/**
 * Returns the days from `start` to `end` counted by `basis` (`dayCountByBasis`).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} start - the start date serial
 * @param {number} end - the end date serial
 * @param {number} basis - the day-count basis: 0 to 4
 */
function dayCount(dateTimeHelper: DateTimeHelper, start: number, end: number, basis: number): number {
  return dateTimeHelper.dayCountByBasis(start, end, basis).dayCount
}

/**
 * Returns the days from `start` to `end` counted by `basis`, or 0 when `end` is not after `start`.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} start - the start date serial
 * @param {number} end - the end date serial
 * @param {number} basis - the day-count basis: 0 to 4
 */
function daysIfForward(dateTimeHelper: DateTimeHelper, start: number, end: number, basis: number): number {
  return end > start ? dayCount(dateTimeHelper, start, end, basis) : 0
}

/**
 * Returns true when `date` is the last day of February.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} date - the date
 */
function isFebruaryEnd(dateTimeHelper: DateTimeHelper, date: SimpleDate): boolean {
  return date.month === 2 && isMonthEnd(dateTimeHelper, date)
}
