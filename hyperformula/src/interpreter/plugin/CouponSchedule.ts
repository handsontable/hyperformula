/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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
 * Constant time: the drifted day is the smallest of maturity's day and the lengths of the months visited, and those
 * months repeat every year, so after `2 * frequency` steps (two Februaries, at least one in a non-leap year) the
 * day no longer changes.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} maturity - the maturity date
 * @param {number} periods - the number of coupon periods to step back
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
function driftedCouponDate(dateTimeHelper: DateTimeHelper, maturity: SimpleDate, periods: number, frequency: number): SimpleDate {
  const monthsPerPeriod = 12 / frequency
  let day = maturity.day
  for (let step = 1; step <= Math.min(periods, 2 * frequency); step++) {
    const visited = offsetMonth(maturity, -step * monthsPerPeriod)
    day = Math.min(day, dateTimeHelper.daysInMonth(visited.year, visited.month))
  }
  const target = offsetMonth(maturity, -periods * monthsPerPeriod)
  return {...target, day: Math.min(day, dateTimeHelper.daysInMonth(target.year, target.month))}
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
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} settlement - the settlement date serial, after `issue`
 * @param {boolean} calcMethod - the `calc_method` argument
 */
export function accruedCouponPeriods(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, settlement: number, calcMethod: boolean): number | CellError {
  const issuePeriod = couponPeriodIndex(dateTimeHelper, issue, schedule.firstInterest, schedule.frequency)
  if (quasiCouponDate(dateTimeHelper, schedule, issuePeriod) < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
  }
  const firstInterest = quasiCouponDate(dateTimeHelper, schedule, 0)
  if (settlement > firstInterest) {
    const settlementPeriod = periodEndingOnOrAfter(dateTimeHelper, schedule, settlement)
    if (dateTimeHelper.getWithinBounds(quasiCouponDate(dateTimeHelper, schedule, settlementPeriod + 1)) === undefined) {
      return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    }
    return accrualFromIssue(dateTimeHelper, schedule, issue, issuePeriod, settlement, calcMethod ? settlementPeriod : FIRST_INTEREST_PERIOD)
  }
  const settlementPeriod = settlement === firstInterest
    ? FIRST_INTEREST_PERIOD
    : couponPeriodIndex(dateTimeHelper, settlement, schedule.firstInterest, schedule.frequency)
  if (!calcMethod && issuePeriod !== settlementPeriod) {
    return partialPeriodsBeforeFirstInterest(dateTimeHelper, schedule, issue, issuePeriod, settlement, settlementPeriod)
  }
  if (settlementPeriod < FIRST_INTEREST_PERIOD) {
    return accrualBeforeFirstInterestPeriod(dateTimeHelper, schedule, issue, issuePeriod, settlement, settlementPeriod)
  }
  return accrualFromIssue(dateTimeHelper, schedule, issue, issuePeriod, settlement, FIRST_INTEREST_PERIOD)
}

/**
 * Returns the index of the period that contains `settlement`, or of the period before it when settlement is on a
 * coupon date: a settlement on a coupon date ends the period before.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} settlement - the settlement date serial
 */
function periodEndingOnOrAfter(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, settlement: number): number {
  const period = couponPeriodIndex(dateTimeHelper, settlement, schedule.firstInterest, schedule.frequency)
  return quasiCouponDate(dateTimeHelper, schedule, period) === settlement ? period - 1 : period
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
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} issuePeriod - the index of the issue's period
 * @param {number} settlement - the settlement date serial
 * @param {number} lastPeriod - the index of the period in which the accrual ends at settlement
 */
function accrualFromIssue(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, lastPeriod: number): number {
  const firstInterestPeriodLength = couponPeriodLength(dateTimeHelper, schedule, FIRST_INTEREST_PERIOD)
  if (issuePeriod >= lastPeriod) {
    return accruedDays(dateTimeHelper, schedule, issue, settlement) / firstInterestPeriodLength
  }
  let periods = issuePeriodPart(dateTimeHelper, schedule, issue, issuePeriod)
    + accruedDays(dateTimeHelper, schedule, quasiCouponDate(dateTimeHelper, schedule, lastPeriod), settlement) / firstInterestPeriodLength
  for (let period = issuePeriod + 1; period < lastPeriod; period++) {
    periods += wholePeriod(dateTimeHelper, schedule, period)
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
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} issuePeriod - the index of the issue's period
 * @param {number} settlement - the settlement date serial
 * @param {number} settlementPeriod - the index of the settlement's period, before `first_interest`'s
 */
function accrualBeforeFirstInterestPeriod(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, settlementPeriod: number): number {
  const {basis, frequency} = schedule
  const daysAfterSettlementPeriod = basis === 0 || basis === 4
    ? (FIRST_INTEREST_PERIOD - settlementPeriod) * 360 / frequency
    : quasiCouponDate(dateTimeHelper, schedule, 0) - quasiCouponDate(dateTimeHelper, schedule, settlementPeriod + 1)
  const daysToFirstInterest = settlementPeriodLength(dateTimeHelper, schedule, issuePeriod, settlementPeriod)
    - accruedDays(dateTimeHelper, schedule, quasiCouponDate(dateTimeHelper, schedule, settlementPeriod), settlement) + daysAfterSettlementPeriod
  return issuePeriodPart(dateTimeHelper, schedule, issue, issuePeriod)
    + ((FIRST_INTEREST_PERIOD - issuePeriod) - daysToFirstInterest / couponPeriodLength(dateTimeHelper, schedule, FIRST_INTEREST_PERIOD))
}

/**
 * Returns the accrued coupon periods with `calc_method` FALSE when issue and settlement are in different periods
 * and settlement is on or before `first_interest`: the issue's partial period (none when issue is on a coupon date),
 * plus the settlement's partial period over its length, minus the whole periods from the settlement's period to
 * `first_interest`. The result can be negative.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} issuePeriod - the index of the issue's period
 * @param {number} settlement - the settlement date serial
 * @param {number} settlementPeriod - the index of the settlement's period, not after `first_interest`'s
 */
function partialPeriodsBeforeFirstInterest(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, issuePeriod: number, settlement: number, settlementPeriod: number): number {
  const issuePart = quasiCouponDate(dateTimeHelper, schedule, issuePeriod) === issue ? 0 : issuePeriodPart(dateTimeHelper, schedule, issue, issuePeriod)
  const settlementPart = accruedDays(dateTimeHelper, schedule, quasiCouponDate(dateTimeHelper, schedule, settlementPeriod), settlement)
    / couponPeriodLength(dateTimeHelper, schedule, settlementPeriod)
  return issuePart + settlementPart - (FIRST_INTEREST_PERIOD - settlementPeriod)
}

/**
 * Returns the part of the issue's period from issue to the next coupon date, over the period's length:
 * `issuePeriodLength` when the period is before `first_interest`'s, `couponPeriodLength` otherwise. An issue on a
 * coupon date gives a whole period (`wholePeriod`).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issue - the issue date serial
 * @param {number} issuePeriod - the index of the issue's period
 */
function issuePeriodPart(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issue: number, issuePeriod: number): number {
  if (quasiCouponDate(dateTimeHelper, schedule, issuePeriod) === issue) {
    return wholePeriod(dateTimeHelper, schedule, issuePeriod)
  }
  const length = issuePeriod < FIRST_INTEREST_PERIOD
    ? issuePeriodLength(dateTimeHelper, schedule, issuePeriod)
    : couponPeriodLength(dateTimeHelper, schedule, issuePeriod)
  return accruedDays(dateTimeHelper, schedule, issue, quasiCouponDate(dateTimeHelper, schedule, issuePeriod + 1)) / length
}

/**
 * Returns a whole period in coupon periods: 1, except for a period after `first_interest` under basis 1, which is
 * its actual length over its length as `couponPeriodLength` gives it. The two lengths differ only when the period's
 * end rolls over (`periodEndRollsOver`), so the date arithmetic is skipped for every other period.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the index of the period
 */
function wholePeriod(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): number {
  if (period < 0 || schedule.basis !== 1 || !periodEndRollsOver(dateTimeHelper, schedule, period)) {
    return 1
  }
  const actualLength = quasiCouponDate(dateTimeHelper, schedule, period + 1) - quasiCouponDate(dateTimeHelper, schedule, period)
  return actualLength / couponPeriodLength(dateTimeHelper, schedule, period)
}

/**
 * Returns true when `rolledOverPeriodEnd` is after the coupon date that ends `period`: `first_interest` is not the
 * last day of its month and its day does not exist in the month of that coupon date.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the index of the period
 */
function periodEndRollsOver(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): boolean {
  const {firstInterest, frequency} = schedule
  const end = offsetMonth(firstInterest, (period + 1) * 12 / frequency)
  return !isMonthEnd(dateTimeHelper, firstInterest) && firstInterest.day > dateTimeHelper.daysInMonth(end.year, end.month)
}

/**
 * Returns the length in days of a period that is not the issue's period before `first_interest`'s: 360 /
 * `frequency` under bases 0, 2 and 4, 365 / `frequency` under basis 3, and under basis 1 the days from the period
 * start to `rolledOverPeriodEnd`.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the index of the period
 */
function couponPeriodLength(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): number {
  switch (schedule.basis) {
    case 1:
      return rolledOverPeriodEnd(dateTimeHelper, schedule, period) - quasiCouponDate(dateTimeHelper, schedule, period)
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
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the index of the issue's period, before `first_interest`'s
 */
function issuePeriodLength(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): number {
  const {firstInterest, frequency} = schedule
  const start = couponDate(dateTimeHelper, firstInterest, period, frequency)
  switch (schedule.basis) {
    case 0:
    case 2:
      return days360(dateTimeHelper, start, dateTimeHelper.numberToSimpleDate(rolledOverPeriodEnd(dateTimeHelper, schedule, period)))
    case 4: {
      const next = couponDate(dateTimeHelper, firstInterest, period + 1, frequency)
      const end = {...next, day: isMonthEnd(dateTimeHelper, firstInterest) ? next.day : firstInterest.day}
      return daysIn30DayMonths(toBasisEU(start), toBasisEU(end))
    }
    default:
      return couponPeriodLength(dateTimeHelper, schedule, period)
  }
}

/**
 * Returns the length in days that Excel uses for the settlement's period when settlement is in a period before
 * `first_interest`'s: the days to the next coupon date when issue is in the same period (US 30/360 under bases 0
 * and 2, European 30/360 under basis 4, actual under basis 1, 365 / `frequency` under basis 3), and
 * `issuePeriodLength` otherwise.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} issuePeriod - the index of the issue's period
 * @param {number} settlementPeriod - the index of the settlement's period, before `first_interest`'s
 */
function settlementPeriodLength(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, issuePeriod: number, settlementPeriod: number): number {
  if (issuePeriod !== settlementPeriod) {
    return issuePeriodLength(dateTimeHelper, schedule, settlementPeriod)
  }
  const {firstInterest, frequency} = schedule
  switch (schedule.basis) {
    case 0:
    case 2:
      return days360(dateTimeHelper, couponDate(dateTimeHelper, firstInterest, settlementPeriod, frequency), couponDate(dateTimeHelper, firstInterest, settlementPeriod + 1, frequency))
    case 3:
      return 365 / frequency
    default:
      return accruedDays(dateTimeHelper, schedule, quasiCouponDate(dateTimeHelper, schedule, settlementPeriod), quasiCouponDate(dateTimeHelper, schedule, settlementPeriod + 1))
  }
}

/**
 * Returns the date serial of the day with `first_interest`'s day of the month in the month of the coupon date that
 * ends `period`, rolled over into the next month when that month is shorter (for `first_interest` on 30 August,
 * "30 February 2008" is 1 March 2008). A month-end `first_interest` gives the coupon date itself.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the index of the period
 */
function rolledOverPeriodEnd(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): number {
  const {firstInterest, frequency} = schedule
  const next = couponDate(dateTimeHelper, firstInterest, period + 1, frequency)
  const day = isMonthEnd(dateTimeHelper, firstInterest) ? next.day : firstInterest.day
  return dateTimeHelper.dateToNumber(next) + day - next.day
}

/**
 * Counts the days from `start` to `end` with the US (NASD) 30/360 method as Microsoft documents it for Excel's
 * DAYS360: a start date on the last day of its month counts as day 30; an end date on the last day of its month
 * counts as the 1st of the next month when the start day is below 30, and as day 30 otherwise.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {SimpleDate} start - the start date
 * @param {SimpleDate} end - the end date
 */
function days360(dateTimeHelper: DateTimeHelper, start: SimpleDate, end: SimpleDate): number {
  const adjustedStart = {...start, day: isMonthEnd(dateTimeHelper, start) ? 30 : start.day}
  if (!isMonthEnd(dateTimeHelper, end)) {
    return daysIn30DayMonths(adjustedStart, end)
  }
  const adjustedEnd = adjustedStart.day < 30 ? {...offsetMonth(end, 1), day: 1} : {...end, day: 30}
  return daysIn30DayMonths(adjustedStart, adjustedEnd)
}

/**
 * Returns the days from `start` to `end` counted by the schedule's basis.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} start - the start date serial
 * @param {number} end - the end date serial
 */
function accruedDays(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, start: number, end: number): number {
  return dateTimeHelper.dayCountByBasis(start, end, schedule.basis).dayCount
}

/**
 * Returns the date serial of the coupon date `period` periods after `first_interest` (before it when negative).
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {QuasiCouponSchedule} schedule - the schedule anchored at `first_interest`
 * @param {number} period - the number of periods after `first_interest`, negative before it
 */
function quasiCouponDate(dateTimeHelper: DateTimeHelper, schedule: QuasiCouponSchedule, period: number): number {
  return dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, schedule.firstInterest, period, schedule.frequency))
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
