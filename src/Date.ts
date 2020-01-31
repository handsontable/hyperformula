import {Config} from './Config'

const numDays: number[] = [ 31, 28, 31, 30, 31, 30, 31, 31, 30 , 31, 30, 31]
const prefSumDays: number[] = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 303, 334 ]

export interface IDate {
  year: number,
  month: number,
  day: number
}

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

function toDateNumberFromZero(date: IDate): number {
  return 365*date.year + prefSumDays[date.month-1] + date.day-1 + (date.month<=2 ? leapYearsCount(date.year - 1) : leapYearsCount(date.year))
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



export function toDateNumber(date: IDate): number {
  return toDateNumberFromZero(date) - 693958 // toDateNumberFromZero(1899,12,30)
}

export function numberToDate(arg: number): IDate {
  const dateNumber = arg + 693958 // toDateNumberFromZero(1899,12,30)
  let year = Math.floor(dateNumber / 365.2425)
  if(toDateNumberFromZero({year: year + 1, month: 1, day: 1}) <= dateNumber){
    year++
  }
  else if(toDateNumberFromZero({year: year - 1, month: 1, day: 1}) > dateNumber){
    year--
  }

  const dayOfYear = dateNumber - toDateNumberFromZero( {year: year, month: 1, day: 1})
  const month = dayToMonth(
    (isLeapYear(year) && dayOfYear >= 59) ? dayOfYear - 1 : dayOfYear
  )
  const day = dayOfYear - prefSumDays[month]
  return {year: year, month: month+1, day: day+1}
}

export function dateNumberToDayNumber(dateNumber: number): number {
  return numberToDate(dateNumber).day
}

export function dateNumberToMonthNumber(dateNumber: number): number {
  return numberToDate(dateNumber).month
}

export function dateNumberToYearNumber(dateNumber: number): number {
  return numberToDate(dateNumber).year
}

export function isValidDate(date: IDate): boolean {
  if(isNaN(date.year) || isNaN(date.month) || isNaN(date.day)) {
    return false
  } else if(date.day !== Math.round(date.day) || date.month !== Math.round(date.month) || date.year !== Math.round(date.year)) {
    return false
  } else if( date.year < 1582) {  //Gregorian calendar start
    return false
  } else if(date.month < 1 || date.month > 12) {
    return false
  } else if(date.day < 1) {
    return false
  } else if(isLeapYear(date.year) && date.month===2) {
    return date.day <= 29
  } else {
    return date.day <= numDays[date.month - 1]
  }
}

export function endOfMonth(date: IDate): IDate {
  return {year: date.year, month: date.month, day: numDays[date.month-1]}
}

export function offsetMonth(date: IDate, offset: number): IDate {
  const totalM = 12*date.year + date.month-1 + offset
  return {year: Math.floor(totalM/12), month: totalM % 12 + 1, day: date.day}
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

  const date : IDate = {year: year, month: month, day: day}

  return isValidDate( date ) ? date : null
}

export function dateStringToDateNumber(dateString: string, config: Config): number | null {
  const date = config.parseDate(dateString, config.dateFormat) //should point to parseDate()
  return date ? toDateNumber(date) : null
}
