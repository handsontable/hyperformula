/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Config} from './Config'
import {DateNumber, DateTimeNumber, ExtendedNumber, TimeNumber} from './interpreter/InterpreterValue'
import {Maybe} from './Maybe'

const numDays: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const prefSumDays: number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export interface SimpleDate {
  year: number,
  month: number,
  day: number,
}

export interface SimpleTime {
  hours: number,
  minutes: number,
  seconds: number,
}

export type SimpleDateTime = SimpleDate & SimpleTime

export type DateTime = SimpleTime | SimpleDate | SimpleDateTime

export function instanceOfSimpleDate(obj: any): obj is SimpleDate {
  if (obj && (typeof obj === 'object' || typeof obj === 'function')) {
    return 'year' in obj && typeof obj.year === 'number' && 'month' in obj && typeof obj.month === 'number' && 'day' in obj && typeof obj.day === 'number'
  } else {
    return false
  }
}

export function instanceOfSimpleTime(obj: any): obj is SimpleTime {
  if (obj && (typeof obj === 'object' || typeof obj === 'function')) {
    return 'hours' in obj && typeof obj.hours === 'number' && 'minutes' in obj && typeof obj.minutes === 'number' && 'seconds' in obj && typeof obj.seconds === 'number'
  } else {
    return false
  }
}

export const maxDate: SimpleDate = {year: 9999, month: 12, day: 31}

export class DateTimeHelper {
  private readonly minDateAboluteValue: number
  private readonly maxDateValue: number
  private readonly epochYearZero: number
  private readonly parseDateTime: (dateString: string, dateFormat?: string, timeFormat?: string) => Maybe<DateTime>
  private readonly leapYear1900: boolean

  constructor(private readonly config: Config) {
    this.minDateAboluteValue = this.dateToNumberFromZero(config.nullDate)
    this.maxDateValue = this.dateToNumber(maxDate)
    this.leapYear1900 = config.leapYear1900

    // code below fixes epochYearStart while being leapYear1900 sensitive
    // if nullDate is earlier than fateful 28 Feb 1900 and 1900 is not supposed to be leap year, then we should
    // add two days (this is the config default)
    // otherwise only one day
    if (!this.leapYear1900 && 0 <= this.dateToNumber({year: 1900, month: 2, day: 28})) {
      this.epochYearZero = this.numberToSimpleDate(2).year
    } else {
      this.epochYearZero = this.numberToSimpleDate(1).year
    }
    this.parseDateTime = config.parseDateTime
  }

  public getWithinBounds(dayNumber: number): Maybe<number> {
    return (dayNumber <= this.maxDateValue) && (dayNumber >= 0) ? dayNumber : undefined
  }

  public dateStringToDateNumber(dateTimeString: string): Maybe<ExtendedNumber> {
    const {dateTime, dateFormat = '', timeFormat = ''} = this.parseDateTimeFromConfigFormats(dateTimeString)
    if (dateTime === undefined) {
      return undefined
    }
    if (instanceOfSimpleTime(dateTime)) {
      if (instanceOfSimpleDate(dateTime)) {
        return new DateTimeNumber(timeToNumber(dateTime) + this.dateToNumber(dateTime), dateFormat + ' ' + timeFormat)
      } else {
        return new TimeNumber(timeToNumber(dateTime), timeFormat)
      }
    } else {
      if (instanceOfSimpleDate(dateTime)) {
        return new DateNumber(this.dateToNumber(dateTime), dateFormat)
      } else {
        return 0
      }
    }
  }

  public parseDateTimeFromConfigFormats(dateTimeString: string): Partial<{ dateTime: DateTime, dateFormat: string, timeFormat: string }> {
    return this.parseDateTimeFromFormats(dateTimeString, this.config.dateFormats, this.config.timeFormats)
  }

  public getNullYear() {
    return this.config.nullYear
  }

  public getEpochYearZero() {
    return this.epochYearZero
  }

  public isValidDate(date: SimpleDate): boolean {
    if (isNaN(date.year) || isNaN(date.month) || isNaN(date.day)) {
      return false
    } else if (date.day !== Math.round(date.day) || date.month !== Math.round(date.month) || date.year !== Math.round(date.year)) {
      return false
    } else if (date.year < 1582) {  // Gregorian calendar start
      return false
    } else if (date.month < 1 || date.month > 12) {
      return false
    } else if (date.day < 1) {
      return false
    } else if (this.isLeapYear(date.year) && date.month === 2) {
      return date.day <= 29
    } else {
      return date.day <= numDays[date.month - 1]
    }
  }

  public dateToNumber(date: SimpleDate): number {
    return this.dateToNumberFromZero(date) - this.minDateAboluteValue
  }

  public relativeNumberToAbsoluteNumber(arg: number): number {
    return arg + this.minDateAboluteValue - (this.leapYear1900 ? 1 : 0)
  }

  public numberToSimpleDate(arg: number): SimpleDate {
    const dateNumber = Math.floor(arg) + this.minDateAboluteValue
    let year = Math.floor(dateNumber / 365.2425)
    if (this.dateToNumberFromZero({year: year + 1, month: 1, day: 1}) <= dateNumber) {
      year++
    } else if (this.dateToNumberFromZero({year: year - 1, month: 1, day: 1}) > dateNumber) {
      year--
    }

    const dayOfYear = dateNumber - this.dateToNumberFromZero({year, month: 1, day: 1})
    const month = dayToMonth(dayOfYear - (this.isLeapYear(year) && dayOfYear >= 59 ? 1 : 0))
    const day = dayOfYear - prefSumDays[month] - (this.isLeapYear(year) && month > 1 ? 1 : 0)
    return {year, month: month + 1, day: day + 1}
  }

  public numberToSimpleDateTime(arg: number): SimpleDateTime {
    return {...this.numberToSimpleDate(Math.floor(arg)), ...numberToSimpleTime(arg % 1)}
  }

  public leapYearsCount(year: number): number {
    return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + (this.config.leapYear1900 && year >= 1900 ? 1 : 0)
  }

  public daysInMonth(year: number, month: number): number {
    if (this.isLeapYear(year) && month === 2) {
      return 29
    } else {
      return numDays[month - 1]
    }
  }

  public endOfMonth(date: SimpleDate): SimpleDate {
    return {year: date.year, month: date.month, day: this.daysInMonth(date.year, date.month)}
  }

  public toBasisUS(start: SimpleDate, end: SimpleDate): [SimpleDate, SimpleDate] {
    if (start.day === 31) {
      start.day = 30
    }
    if (start.day === 30 && end.day === 31) {
      end.day = 30
    }
    if (start.month === 2 && start.day === this.daysInMonth(start.year, start.month)) {
      start.day = 30
      if (end.month === 2 && end.day === this.daysInMonth(end.year, end.month)) {
        end.day = 30
      }
    }
    return [start, end]
  }

  public yearLengthForBasis(start: SimpleDate, end: SimpleDate): number {
    if (start.year !== end.year) {
      if ((start.year + 1 !== end.year) || (start.month < end.month) || (start.month === end.month && start.day < end.day)) {
        // this is true IFF at least one year of gap between dates
        return (this.leapYearsCount(end.year) - this.leapYearsCount(start.year - 1)) / (end.year - start.year + 1) + 365
      }
      if (this.countLeapDays(end) !== this.countLeapDays({year: start.year, month: start.month, day: start.day - 1})) {
        return 366
      } else {
        return 365
      }
    }
    if (this.isLeapYear(start.year)) {
      return 366
    } else {
      return 365
    }
  }

  private parseSingleFormat(dateString: string, dateFormat?: string, timeFormat?: string): Maybe<DateTime> {
    const dateTime = this.parseDateTime(dateString, dateFormat, timeFormat)
    if (instanceOfSimpleDate(dateTime)) {
      if (dateTime.year >= 0 && dateTime.year < 100) {
        if (dateTime.year < this.getNullYear()) {
          dateTime.year += 2000
        } else {
          dateTime.year += 1900
        }
      }
      if (!this.isValidDate(dateTime)) {
        return undefined
      }
    }
    return dateTime
  }

  private parseDateTimeFromFormats(dateTimeString: string, dateFormats: string[], timeFormats: string[]): Partial<{ dateTime: DateTime, dateFormat: string, timeFormat: string }> {
    const dateFormatsIterate = dateFormats.length === 0 ? [undefined] : dateFormats
    const timeFormatsIterate = timeFormats.length === 0 ? [undefined] : timeFormats
    for (const dateFormat of dateFormatsIterate) {
      for (const timeFormat of timeFormatsIterate) {
        const dateTime = this.parseSingleFormat(dateTimeString, dateFormat, timeFormat)
        if (dateTime !== undefined) {
          return {dateTime, timeFormat, dateFormat}
        }
      }
    }
    return {}
  }

  private countLeapDays(date: SimpleDate): number {
    if (date.month > 2 || (date.month === 2 && date.day >= 29)) {
      return this.leapYearsCount(date.year)
    } else {
      return this.leapYearsCount(date.year - 1)
    }
  }

  private dateToNumberFromZero(date: SimpleDate): number {
    return 365 * date.year + prefSumDays[date.month - 1] + date.day - 1 + (date.month <= 2 ? this.leapYearsCount(date.year - 1) : this.leapYearsCount(date.year))
  }

  private isLeapYear(year: number): boolean {
    if (year % 4) {
      return false
    } else if (year % 100) {
      return true
    } else if (year % 400) {
      return year === 1900 && this.config.leapYear1900
    } else {
      return true
    }
  }
}

function dayToMonth(dayOfYear: number): number {
  let month = 0
  if (prefSumDays[month + 6] <= dayOfYear) {
    month += 6
  }
  if (prefSumDays[month + 3] <= dayOfYear) {
    month += 3
  }
  if (prefSumDays[month + 2] <= dayOfYear) {
    month += 2
  } else if (prefSumDays[month + 1] <= dayOfYear) {
    month += 1
  }
  return month
}

export function offsetMonth(date: SimpleDate, offset: number): SimpleDate {
  const totalM = 12 * date.year + date.month - 1 + offset
  return {year: Math.floor(totalM / 12), month: totalM % 12 + 1, day: date.day}
}

export function truncateDayInMonth(date: SimpleDate): SimpleDate {
  return {year: date.year, month: date.month, day: Math.min(date.day, numDays[date.month - 1])}
}

export function roundToNearestSecond(arg: number): number {
  return Math.round(arg * 3600 * 24) / (3600 * 24)
}

export function numberToSimpleTime(arg: number): SimpleTime {
  arg = Math.round(arg * 24 * 60 * 60 * 100000) / (24 * 60 * 60 * 100000)
  arg *= 24
  const hours = Math.floor(arg)
  arg -= hours
  arg *= 60
  const minutes = Math.floor(arg)
  arg -= minutes
  arg *= 60
  const seconds = Math.round(arg * 100000) / 100000
  return {hours, minutes, seconds}
}

export function timeToNumber(time: SimpleTime): number {
  return ((time.seconds / 60 + time.minutes) / 60 + time.hours) / 24
}

export function toBasisEU(date: SimpleDate): SimpleDate {
  return {year: date.year, month: date.month, day: Math.min(30, date.day)}
}

