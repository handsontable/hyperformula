/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {DateTimeHelper, offsetMonth, SimpleDate} from '../../DateTimeHelper'
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
  const shifted = offsetMonth(anchor, periods * 12 / frequency)
  const lastDay = dateTimeHelper.daysInMonth(shifted.year, shifted.month)
  const isAnchorMonthEnd = anchor.day === dateTimeHelper.daysInMonth(anchor.year, anchor.month)
  return {...shifted, day: isAnchorMonthEnd ? lastDay : Math.min(anchor.day, lastDay)}
}

/**
 * Returns the number of coupon dates after `settlement`, up to and including `maturity`: the smallest k >= 1 for
 * which the coupon date k periods before maturity is on or before settlement.
 *
 * Runs in constant time instead of stepping through the periods (a quarterly schedule over the whole supported date
 * range has 32,400 of them): the whole periods in the months between settlement and maturity give a coupon date in
 * settlement's month or later, and one period more gives a date before settlement's month.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} settlement - the settlement date serial, truncated
 * @param {SimpleDate} maturity - the maturity date
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 */
export function couponsAfter(dateTimeHelper: DateTimeHelper, settlement: number, maturity: SimpleDate, frequency: number): number {
  const settlementDate = dateTimeHelper.numberToSimpleDate(settlement)
  const months = 12 * (maturity.year - settlementDate.year) + maturity.month - settlementDate.month
  const periods = Math.floor(months * frequency / 12)
  if (periods > 0 && dateTimeHelper.dateToNumber(couponDate(dateTimeHelper, maturity, -periods, frequency)) <= settlement) {
    return periods
  }
  return periods + 1
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
 * The terms of the bond price and duration formulas, for the coupon period that contains settlement.
 */
export interface SettlementPeriod {
  /** N: the number of coupon dates after settlement, up to and including maturity. */
  couponCount: number,
  /** A: the number of days from the previous coupon date to settlement, counted by the basis. */
  daysFromPeriodStart: number,
  /** E: the number of days in the coupon period, see `settlementPeriod`. */
  periodDays: number,
  /** DSC: the number of days from settlement to the next coupon date, E - A. */
  daysToNextCoupon: number,
}

/**
 * Builds the coupon schedule of a coupon function call from its validated arguments. A previous coupon date before
 * the earliest supported date is #NUM!.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {number} settlement - the settlement date serial, truncated
 * @param {number} maturity - the maturity date serial, truncated, later than `settlement`
 * @param {number} frequency - the number of coupons per year: 1, 2 or 4
 * @param {number} basis - the day-count basis: 0 to 4
 */
export function buildCouponSchedule(dateTimeHelper: DateTimeHelper, settlement: number, maturity: number, frequency: number, basis: number): CouponSchedule | CellError {
  const maturityDate = dateTimeHelper.numberToSimpleDate(maturity)
  const count = couponsAfter(dateTimeHelper, settlement, maturityDate, frequency)
  const previous = couponDate(dateTimeHelper, maturityDate, -count, frequency)
  if (dateTimeHelper.dateToNumber(previous) < 0) {
    return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
  }
  const next = couponDate(dateTimeHelper, maturityDate, 1 - count, frequency)
  return {settlement, maturity: maturityDate, frequency, basis, count, previous, next}
}

/**
 * Returns N, A, E and DSC, the terms of the bond price and duration formulas, for the coupon period that contains
 * settlement. A is counted as COUPDAYBS counts it. E is 360 / `frequency` for bases 0, 2 and 4, 365 / `frequency` for
 * basis 3, and the days from the previous to the next coupon date for basis 1 (not the length COUPDAYS gives for
 * basis 1). DSC is E - A, which is not always what COUPDAYSNC gives.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {CouponSchedule} schedule - the coupon schedule
 */
export function settlementPeriod(dateTimeHelper: DateTimeHelper, schedule: CouponSchedule): SettlementPeriod {
  const daysFromPeriodStart = daysBeforeSettlement(dateTimeHelper, schedule)
  const periodDays = settlementPeriodDays(dateTimeHelper, schedule)
  return {couponCount: schedule.count, daysFromPeriodStart, periodDays, daysToNextCoupon: periodDays - daysFromPeriodStart}
}

/**
 * Returns E, the number of days in the coupon period that contains settlement, as the bond price and duration
 * formulas count it: see `settlementPeriod`.
 *
 * @param {DateTimeHelper} dateTimeHelper - the engine's date helper
 * @param {CouponSchedule} schedule - the coupon schedule
 */
function settlementPeriodDays(dateTimeHelper: DateTimeHelper, schedule: CouponSchedule): number {
  switch (schedule.basis) {
    case 1:
      return dateTimeHelper.dateToNumber(schedule.next) - dateTimeHelper.dateToNumber(schedule.previous)
    case 3:
      return 365 / schedule.frequency
    default:
      return 360 / schedule.frequency
  }
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
