import {Config} from './Config'
import {Maybe} from './Maybe'

const numDays: number[] = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const prefSumDays: number[] = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 303, 334 ]

export interface SimpleDate {
  year: number,
  month: number,
  day: number,
}

export interface SimpleTime {
  hour: number,
  minute: number,
  second: number,
}

export type SimpleDateTime = SimpleDate & SimpleTime

export type DateTime = SimpleTime | SimpleDate | SimpleDateTime

export function instanceOfSimpleDate(obj: any): obj is SimpleDate {
  if( obj && (typeof obj === 'object' || typeof obj === 'function')) {
    return 'year' in obj && typeof obj.year === 'number' && 'month' in obj && typeof obj.month === 'number' && 'day' in obj && typeof obj.day === 'number'
  } else {
    return false
  }
}

export function instanceOfSimpleTime(obj: any): obj is SimpleTime {
  if( obj && (typeof obj === 'object' || typeof obj === 'function')) {
    return 'hour' in obj && typeof obj.hour === 'number' && 'minute' in obj && typeof obj.minute === 'number' && 'second' in obj && typeof obj.second === 'number'
  } else {
    return false
  }
}

export function instanceOfSimpleDateTime(obj: any): obj is SimpleDateTime {
  return instanceOfSimpleDate(obj) && instanceOfSimpleTime(obj)
}

export const maxDate: SimpleDate = {year: 9999, month: 12, day: 31}

export class DateHelper {
  private minDateValue: number
  private maxDateValue: number
  private epochYearZero: number
  private parseDateTime: (dateString: string, dateFormat: string, timeFormat: string) => Maybe<DateTime>
  constructor(private readonly config: Config) {
    this.config = config
    this.minDateValue = this.dateToNumber(config.nullDate)
    this.maxDateValue = this.dateToNumber(maxDate)

    // code below fixes epochYearStart while being leapYear1900 sensitive
    // if nullDate is earlier than fateful 28 Feb 1900 and 1900 is not supposed to be leap year, then we should
    // add two days (this is the config default)
    // otherwise only one day
    if(!config.leapYear1900 && this.minDateValue <= this.dateToNumber({year: 1900, month: 2, day: 28})) {
      this.epochYearZero = this.numberToDate(2).year
    } else {
      this.epochYearZero = this.numberToDate(1).year
    }
    this.parseDateTime = config.parseDateTime
  }

  public getWithinBounds(dayNumber: number) {
    return (dayNumber <= this.maxDateValue) && (dayNumber >= this.minDateValue)
  }

  public dateStringToDateNumber(dateTimeString: string): Maybe<number> {
    const dateTime = this.parseDateTimeFromFormats(dateTimeString, this.config.dateFormats, this.config.timeFormats)
    if(dateTime === undefined) {
      return undefined
    }
    return (instanceOfSimpleTime(dateTime) ? this.timeToNumber(dateTime) : 0) +
      (instanceOfSimpleDate(dateTime) ? this.dateToNumber(dateTime) : 0)
  }

  private parseSingleFormat(dateString: string, dateFormat: string, timeFormat: string): Maybe<DateTime> {
    const dateTime = this.parseDateTime(dateString, dateFormat, timeFormat)
    if(instanceOfSimpleDate(dateTime)) {
      if(dateTime.year >=0 && dateTime.year < 100) {
        if (dateTime.year < this.getNullYear()) {
          dateTime.year += 2000
        } else {
          dateTime.year += 1900
        }
      }
      if(!this.isValidDate(dateTime)) {
        return undefined
      }
    }
    return dateTime
  }

  private parseDateTimeFromFormats(dateString: string, dateFormats: string[], timeFormats: string[]): Maybe<DateTime> {
    for (const dateFormat of dateFormats) {
      for (const timeFormat of timeFormats) {
        const dateTime = this.parseSingleFormat(dateString, dateFormat, timeFormat)
        if (dateTime !== undefined) {
          return dateTime
        }
      }
    }
    return undefined
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
    return this.dateToNumberFromZero(date) - this.dateToNumberFromZero(this.config.nullDate)
  }

  public timeToNumber(time: SimpleTime): number {
    return ((time.second/60+time.minute)/60+time.hour)/24
  }

  public numberToDate(arg: number): SimpleDate {
    const dateNumber = arg + this.dateToNumberFromZero(this.config.nullDate)
    let year = Math.floor(dateNumber / 365.2425)
    if (this.dateToNumberFromZero({year: year + 1, month: 1, day: 1}) <= dateNumber) {
      year++
    } else if (this.dateToNumberFromZero({year: year - 1, month: 1, day: 1}) > dateNumber) {
      year--
    }

    const dayOfYear = dateNumber - this.dateToNumberFromZero( {year, month: 1, day: 1})
    const month = dayToMonth(
      (this.isLeapYear(year) && dayOfYear >= 59) ? dayOfYear - 1 : dayOfYear,
    )
    const day = dayOfYear - prefSumDays[month]
    return {year, month: month + 1, day: day + 1}
  }

  public numberToTime(arg: number): SimpleTime {
    let second = Math.round(arg*60*60*24)
    let minute = Math.floor(second / 60)
    second = second % 60
    const hour = Math.floor(minute / 60)
    minute = minute % 60
    return {hour, minute, second}
  }

  public numberToDateTime(arg: number): SimpleDateTime {
    return {...this.numberToDate(Math.floor(arg)), ...this.numberToTime(arg%1)}
  }

  private leapYearsCount(year: number): number {
    return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + (this.config.leapYear1900 && year >= 1900 ? 1 : 0)
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

export function endOfMonth(date: SimpleDate): SimpleDate {
  return {year: date.year, month: date.month, day: numDays[date.month - 1]}
}

export function offsetMonth(date: SimpleDate, offset: number): SimpleDate {
  const totalM = 12 * date.year + date.month - 1 + offset
  return {year: Math.floor(totalM / 12), month: totalM % 12 + 1, day: date.day}
}

export function defaultParseToDateTime(dateTimeString: string, dateFormat: string, timeFormat: string): Maybe<DateTime> {
  dateTimeString = dateTimeString.replace(/\s\s+/g, ' ').trim().toLowerCase()
  let ampmtoken: string | undefined = dateTimeString.substring(dateTimeString.length-2)
  if(ampmtoken === 'am' || ampmtoken === 'pm') {
    dateTimeString = dateTimeString.substring(0, dateTimeString.length-2).trim()
  } else {
    ampmtoken = undefined
  }
  const dateItems = dateTimeString.split(/[ /.-]/g )
  const timeItems = dateItems[dateItems.length - 1].split(':')
  if(ampmtoken !== undefined) {
    timeItems.push(ampmtoken)
  }

  if(dateItems.length === 1) {
    return defaultParseToTime(timeItems, timeFormat)
  }
  if(timeItems.length === 1) {
    return defaultParseToDate(dateItems, dateFormat)
  }
  const parsedDate = defaultParseToDate(dateItems.slice(0, dateItems.length-1), dateFormat)
  const parsedTime = defaultParseToTime(timeItems, timeFormat)
  if(parsedDate===undefined) {
    return undefined
  } else if(parsedTime===undefined) {
    return undefined
  } else {
    return {...parsedDate, ...parsedTime}
  }
}

export function defaultParseToTime(timeItems: string[], timeFormat: string): Maybe<SimpleTime> {
  timeFormat = timeFormat.toLowerCase()
  if(timeFormat.length >= 1 && timeFormat.endsWith('a')) {
    timeFormat = timeFormat.substring(0, timeFormat.length-1).trim()
  }
  const formatItems = timeFormat.split(':')
  let ampm = undefined
  if(timeItems[timeItems.length-1] === 'am') {
    ampm = false
    timeItems.pop()
  } else if(timeItems[timeItems.length-1] === 'pm') {
    ampm = true
    timeItems.pop()
  }
  if(timeItems.length !== formatItems.length) {
    return undefined
  }
  const hourIndex = formatItems.indexOf('hh')
  const minuteIndex = formatItems.indexOf('mm')
  const secondIndex = formatItems.indexOf('ss')

  const hourString = hourIndex!==-1 ? timeItems[hourIndex] : '0'
  if(! /^\d+$/.test(hourString)) {
    return undefined
  }
  let hour = Number(hourString)
  if(ampm !== undefined) {
    if(hour < 0 || hour > 12) {
      return undefined
    }
    hour = hour % 12
    if(ampm) {
      hour = hour + 12
    }
  }

  const minuteString = minuteIndex!==-1 ? timeItems[minuteIndex] : '0'
  if(! /^\d+$/.test(minuteString)) {
    return undefined
  }
  const minute = Number(minuteString)

  const secondString = secondIndex!==-1 ? timeItems[secondIndex] : '0'
  if(! /^\d+$/.test(secondString)) {
    return undefined
  }
  const second = Number(secondString)

  return {hour, minute, second}
}

export function defaultParseToDate(dateItems: string[], dateFormat: string): Maybe<SimpleDate> {
  const formatItems = dateFormat.toLowerCase().split(/[ /.-]/g )
  if(dateItems.length !== formatItems.length) {
    return undefined
  }
  const monthIndex  = formatItems.indexOf('mm')
  const dayIndex    = formatItems.indexOf('dd')
  const yearIndexLong   = formatItems.indexOf('yyyy')
  const yearIndexShort  = formatItems.indexOf('yy')
  if (!(monthIndex in dateItems) || !(dayIndex in dateItems) ||
    (!(yearIndexLong in dateItems) && !(yearIndexShort in dateItems))) {
    return undefined
  }
  if (yearIndexLong in dateItems && yearIndexShort in dateItems) {
    return undefined
  }
  let year
  if (yearIndexLong in dateItems) {
    const yearString = dateItems[yearIndexLong]
    if(/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 1000 || year > 9999) {
        return undefined
      }
    } else {
      return undefined
    }
  } else {
    const yearString = dateItems[yearIndexShort]
    if(/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 0 || year > 99) {
        return undefined
      }
    } else {
      return undefined
    }
  }
  const monthString = dateItems[monthIndex]
  if(! /^\d+$/.test(monthString)) {
    return undefined
  }
  const month = Number(monthString)
  const dayString = dateItems[dayIndex]
  if(! /^\d+$/.test(dayString)) {
    return undefined
  }
  const day = Number(dayString)
  return {year, month, day}
}

