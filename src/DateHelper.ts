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
  private parseDate: (dateString: string, dateFormat: string) => Maybe<SimpleDate>
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
    this.parseDate = config.parseDate
  }

  public getWithinBounds(dayNumber: number) {
    return (dayNumber <= this.maxDateValue) && (dayNumber >= this.minDateValue)
  }

  public dateStringToDateNumber(dateString: string): Maybe<number> {
    const date = this.parseDateFromFormats(dateString, this.config.dateFormats) // should point to parseDateFromFormats()
    return date!==undefined ? this.dateToNumber(date) : undefined
  }

  private parseDateSingleFormat(dateString: string, dateFormat: string): Maybe<SimpleDate> {
    const date = this.parseDate(dateString, dateFormat)
    if(date === undefined) {
      return undefined
    }
    if(date.year >=0 && date.year < 100) {
      if (date.year < this.getNullYear()) {
        date.year += 2000
      } else {
        date.year += 1900
      }
    }
    return this.isValidDate(date) ? date : undefined
  }

  private parseDateFromFormats(dateString: string, dateFormats: string[]): Maybe<SimpleDate> {
    for (const dateFormat of dateFormats) {
      const date = this.parseDateSingleFormat(dateString, dateFormat)
      if (date !== undefined) {
        return date
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

export function defaultParseToDate(dateString: string, dateFormat: string): Maybe<SimpleDate> {
  const dateItems = dateString.replace(/[^a-zA-Z0-9]/g, '-').split('-')
  const normalizedFormat = dateFormat.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
  const formatItems     = normalizedFormat.split('-')
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
    year = Number(dateItems[yearIndexLong])
    if (year < 1000 || year > 9999) {
      return undefined
    }
  } else {
    year = Number(dateItems[yearIndexShort])
    if (year < 0 || year > 99) {
      return undefined
    }
  }
  const month = Number(dateItems[monthIndex])
  const day   = Number(dateItems[dayIndex])
  return {year, month, day}
}

export function isValidTime(time: SimpleTime) {

}
