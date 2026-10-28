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
  return dayCount(dateTimeHelper, start, end, schedule.basis)
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
