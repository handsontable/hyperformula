import moment, {Moment} from 'moment'
import {Config} from './Config'

const prefSumDays: number[] = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 303, 334 ]

function dayToMonth(dayOfYear: number): number {
  let month = 0
  if(prefSumDays[month+6] <= dayOfYear)
    month+=6
  if(prefSumDays[month+3] <= dayOfYear)
    month+=3
  if(prefSumDays[month+2] <= dayOfYear)
    month+=2
  else if(prefSumDays[month+1] <= dayOfYear)
    month+=1
  return month
}

function leapYearsCount(year: number): number {
  return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400)
}

function toDateNumberFromZero(year: number, month: number, day: number): number {
  return 365*year + prefSumDays[month-1] + day-1 + (month<=2 ? leapYearsCount(year - 1) : leapYearsCount(year))
}

function isLeapYear(year: number): boolean {
  if(year%4) {
    return false
  } else if(year%100) {
    return true
  } else if(year%400) {
    return false
  } else {
    return true
  }
}


export interface IDate {
  year: number,
  month: number,
  day: number
}

/*
 * counting of day and month starts here from 1
 */

export function toDateNumber(year: number, month: number, day: number): number {
  return toDateNumberFromZero(year, month, day) - 693958 // toDateNumberFromZero(1899,12,30)
}

export function numberToDate(arg: number): IDate {
  const dateNumber = arg + 693958 // toDateNumberFromZero(1899,12,30)
  let year = Math.floor(dateNumber / 365.2425)
  if(toDateNumberFromZero(year + 1,1,1) <= dateNumber){
    year++
  }
  else if(toDateNumberFromZero(year - 1,1,1) > dateNumber){
    year--
  }

  const dayOfYear = dateNumber - toDateNumberFromZero(year, 1, 1)
  const month = dayToMonth(
    (isLeapYear(year) && dayOfYear >= 59) ? dayOfYear - 1 : dayOfYear
  )
  const day = dayOfYear - prefSumDays[month]
  return {year: year, month: month, day: day}
}

export function dateNumberToDayNumber(dateNumber: number): number {
  return numberToDate(dateNumber).day + 1
}

export function dateNumberToMonthNumber(dateNumber: number): number {
  return numberToDate(dateNumber).month + 1
}

export function dateNumberToYearNumber(dateNumber: number): number {
  return numberToDate(dateNumber).year
}

export function parseDateWithMoment(dateString: string, dateFormat: string): IDate | null
{
  const date = moment(dateString, dateFormat, true)
  return date.isValid() ? {year: date.year(), month: date.month()+1, day: date.date()} : null
}

export function dateStringToDateNumber(dateString: string, config: Config): number | null {
  const date = config.parseDate(dateString, config.dateFormat)
  return date ? toDateNumber(date.year, date.month, date.day) : null
}
