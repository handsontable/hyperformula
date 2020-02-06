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
  if(prefSumDays[month+6] <= dayOfYear) {
    month += 6
  }
  if(prefSumDays[month+3] <= dayOfYear) {
    month += 3
  }
  if(prefSumDays[month+2] <= dayOfYear) {
    month += 2
  } else if(prefSumDays[month+1] <= dayOfYear) {
    month += 1
  }
  return month
}

function leapYearsCount(year: number, config: Config): number {
  return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + (config.leapYear1900 && year >= 1900? 1 : 0)
}

function dateToNumberFromZero(date: IDate, config: Config): number {
  return 365*date.year + prefSumDays[date.month-1] + date.day-1 + (date.month<=2 ? leapYearsCount(date.year - 1, config) : leapYearsCount(date.year, config))
}

function isLeapYear(year: number, config: Config): boolean {
  if(year%4) {
    return false
  } else if(year%100) {
    return true
  } else if(year%400) {
    return year === 1900 && config.leapYear1900
  } else {
    return true
  }
}

export function dateToNumber(date: IDate, config: Config): number {
  return dateToNumberFromZero(date, config) - dateToNumberFromZero(config.nullDate, config)
}

export function numberToDate(arg: number, config: Config): IDate {
  const dateNumber = arg + dateToNumberFromZero(config.nullDate, config)
  let year = Math.floor(dateNumber / 365.2425)
  if(dateToNumberFromZero({year: year + 1, month: 1, day: 1}, config) <= dateNumber){
    year++
  }
  else if(dateToNumberFromZero({year: year - 1, month: 1, day: 1}, config) > dateNumber){
    year--
  }

  const dayOfYear = dateNumber - dateToNumberFromZero( {year: year, month: 1, day: 1}, config)
  const month = dayToMonth(
    (isLeapYear(year, config) && dayOfYear >= 59) ? dayOfYear - 1 : dayOfYear
  )
  const day = dayOfYear - prefSumDays[month]
  return {year: year, month: month+1, day: day+1}
}

export function dateNumberToDayNumber(dateNumber: number, config: Config): number {
  return numberToDate(dateNumber, config).day
}

export function dateNumberToMonthNumber(dateNumber: number, config: Config): number {
  return numberToDate(dateNumber, config).month
}

export function dateNumberToYearNumber(dateNumber: number, config: Config): number {
  return numberToDate(dateNumber, config).year
}

export function isValidDate(date: IDate, config: Config): boolean {
  if(isNaN(date.year) || isNaN(date.month) || isNaN(date.day)) {
    return false
  } else if(date.day !== Math.round(date.day) || date.month !== Math.round(date.month) || date.year !== Math.round(date.year)) {
    return false
  } else if(date.year < 1582) {  //Gregorian calendar start
    return false
  } else if(date.month < 1 || date.month > 12) {
    return false
  } else if(date.day < 1) {
    return false
  } else if(isLeapYear(date.year, config) && date.month === 2) {
    return date.day <= 29
  } else {
    return date.day <= numDays[date.month - 1]
  }
}

export function endOfMonth(date: IDate): IDate {
  return {year: date.year, month: date.month, day: numDays[date.month-1]}
}

export function offsetMonth(date: IDate, offset: number): IDate {
  const totalM = 12 * date.year + date.month - 1 + offset
  return {year: Math.floor(totalM / 12), month: totalM % 12 + 1, day: date.day}
}

function parseDateSingleFormat(dateString: string, dateFormat: string, config: Config): IDate | null
{
  const dateItems = dateString.replace(/[^a-zA-Z0-9]/g, '-').split('-')
  const normalizedFormat = dateFormat.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
  const formatItems     = normalizedFormat.split('-')
  const monthIndex  = formatItems.indexOf('mm')
  const dayIndex    = formatItems.indexOf('dd')
  const yearIndexLong   = formatItems.indexOf('yyyy')
  const yearIndexShort  = formatItems.indexOf('yy')
  if(!(monthIndex in dateItems) || !(dayIndex in dateItems) ||
    (!(yearIndexLong in dateItems) && !(yearIndexShort in dateItems))) {
    return null
  }
  if(yearIndexLong in dateItems && yearIndexShort in dateItems) {
    return null
  }
  var year
  if(yearIndexLong in dateItems) {
    year = Number(dateItems[yearIndexLong])
    if(year < 1000 || year > 9999) {
      return null
    }
  } else {
    year = Number(dateItems[yearIndexShort])
    if(year < 0 || year > 99) {
      return null
    }
    if(year < config.nullYear) {
      year += 2000
    } else {
      year += 1900
    }
  }
  const month = Number(dateItems[monthIndex])
  const day   = Number(dateItems[dayIndex])

  const date : IDate = {year: year, month: month, day: day}

  return isValidDate( date, config) ? date : null
}

export function parseDate(dateString: string, dateFormats: string[], config: Config): IDate | null
{
  for(let dateFormat of dateFormats)
  {
    const date = parseDateSingleFormat(dateString, dateFormat, config)
    if(date !== null)
     { return date }
  }
  return null
}

export function dateStringToDateNumber(dateString: string, config: Config): number | null {
  const date = config.parseDate(dateString, config.dateFormats, config) //should point to parseDate()
  return date ? dateToNumber(date, config) : null
}
