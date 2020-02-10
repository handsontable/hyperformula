import {Config} from './Config'

const numDays: number[] = [ 31, 28, 31, 30, 31, 30, 31, 31, 30 , 31, 30, 31]
const prefSumDays: number[] = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 303, 334 ]

export interface IDate {
  year: number,
  month: number,
  day: number
}

export const maxDate = {year: 9999, month: 12, day: 31}

export class DateHelper {
  private minDateValue: number
  private maxDateValue: number
  constructor(private readonly config: Config) {
    this.config = config
    this.minDateValue = this.dateToNumber(config.nullDate)
    this.maxDateValue = this.dateToNumber(maxDate)
  }

  public getWithinBounds(dayNumber: number) {
    return (dayNumber <= this.maxDateValue) && (dayNumber >= this.minDateValue)
  }

  public dateStringToDateNumber(dateString: string): number | null {
    const date = this.config.parseDate(dateString, this.config.dateFormats, this) // should point to defaultParseDate()
    return date ? this.dateToNumber(date) : null
  }

  public getNullYear() {
    return this.config.nullYear
  }

  public isValidDate(date: IDate): boolean {
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

  public dateToNumber(date: IDate): number {
    return this.dateToNumberFromZero(date) - this.dateToNumberFromZero(this.config.nullDate)
  }

  public numberToDate(arg: number): IDate {
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

  public dateNumberToDayNumber(dateNumber: number): number {
    return this.numberToDate(dateNumber).day
  }

  public dateNumberToMonthNumber(dateNumber: number): number {
    return this.numberToDate(dateNumber).month
  }

  public dateNumberToYearNumber(dateNumber: number): number {
    return this.numberToDate(dateNumber).year
  }
  private leapYearsCount(year: number): number {
    return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + (this.config.leapYear1900 && year >= 1900 ? 1 : 0)
  }

  private dateToNumberFromZero(date: IDate): number {
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

export function endOfMonth(date: IDate): IDate {
  return {year: date.year, month: date.month, day: numDays[date.month - 1]}
}

export function offsetMonth(date: IDate, offset: number): IDate {
  const totalM = 12 * date.year + date.month - 1 + offset
  return {year: Math.floor(totalM / 12), month: totalM % 12 + 1, day: date.day}
}

function parseDateSingleFormat(dateString: string, dateFormat: string, dateHelper: DateHelper): IDate | null {
  const dateItems = dateString.replace(/[^a-zA-Z0-9]/g, '-').split('-')
  const normalizedFormat = dateFormat.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
  const formatItems     = normalizedFormat.split('-')
  const monthIndex  = formatItems.indexOf('mm')
  const dayIndex    = formatItems.indexOf('dd')
  const yearIndexLong   = formatItems.indexOf('yyyy')
  const yearIndexShort  = formatItems.indexOf('yy')
  if (!(monthIndex in dateItems) || !(dayIndex in dateItems) ||
    (!(yearIndexLong in dateItems) && !(yearIndexShort in dateItems))) {
    return null
  }
  if (yearIndexLong in dateItems && yearIndexShort in dateItems) {
    return null
  }
  let year
  if (yearIndexLong in dateItems) {
    year = Number(dateItems[yearIndexLong])
    if (year < 1000 || year > 9999) {
      return null
    }
  } else {
    year = Number(dateItems[yearIndexShort])
    if (year < 0 || year > 99) {
      return null
    }
    if (year < dateHelper.getNullYear()) {
      year += 2000
    } else {
      year += 1900
    }
  }
  const month = Number(dateItems[monthIndex])
  const day   = Number(dateItems[dayIndex])

  const date: IDate = {year, month, day}

  return dateHelper.isValidDate( date) ? date : null
}

export function defaultParseDate(dateString: string, dateFormats: string[], dateHelper: DateHelper): IDate | null {
  for (const dateFormat of dateFormats) {
    const date = parseDateSingleFormat(dateString, dateFormat, dateHelper)
    if (date !== null) { return date }
  }
  return null
}
