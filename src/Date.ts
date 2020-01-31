import moment from 'moment'
import {Config} from './Config'

const numDays: number[] = [ 31, 28, 31, 30, 31, 30, 31, 31, 30 , 31, 30, 31]
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

export function isValidDate(year: number, month: number, day: number): boolean {
  if(isNaN(year) || isNaN(month) || isNaN(day)) {
    return false
  } else if(day !== Math.round(day) || month !== Math.round(month) || year !== Math.round(year)) {
    return false
  } else if( year < 1582) {  //Gregorian calendar start
    return false
  } else if(month < 1 || month > 12) {
    return false
  } else if(day < 1) {
    return false
  } else if(isLeapYear(year) && month===2) {
    return day <= 29
  } else {
    return day <= numDays[month - 1]
  }
}

export function parseDate(dateString: string, dateFormat: string): IDate | null
{
  const normalizedDateString = dateString.replace(/[^a-zA-Z0-9]/g, '-')
  const normalizedFormat = dateFormat.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
  const formatItems     = normalizedFormat.split('-')
  const dateItems       = normalizedDateString.split('-')

  const monthIndex  = formatItems.indexOf('mm')
  const dayIndex    = formatItems.indexOf('dd')
  const yearIndex   = formatItems.indexOf('yyyy')

  if(!(monthIndex in dateItems) || !(dayIndex in dateItems) || !(yearIndex in dateItems))
    return null

  const year  = Number(dateItems[yearIndex])
  const month = Number(dateItems[monthIndex])
  const day   = Number(dateItems[dayIndex])

  return isValidDate(year, month, day) ? {year: year, month: month, day: day} : null
}

export function dateStringToDateNumber(dateString: string, config: Config): number | null {
  const date = config.parseDate(dateString, config.dateFormat) //should point to parseDate()
  return date ? toDateNumber(date.year, date.month, date.day) : null
}
