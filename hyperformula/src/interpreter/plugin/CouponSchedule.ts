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
  const isFebruaryEnd = date.month === 2 && date.day === dateTimeHelper.daysInMonth(date.year, 2)
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
