/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {DateTimeHelper, offsetMonth, SimpleDate} from '../../DateTimeHelper'

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
