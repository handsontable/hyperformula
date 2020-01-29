import moment, {Moment} from 'moment'

const DATE_ZERO = moment({
  year: 1899,
  month: 11,
  day: 30,
})

const days: number[] = [31,28,31,30,31,30,31,31,30,31,30,31]
const prefSumDays: number[] =
  [0,
    31,
    31 + 28,
    31 + 28 + 31,
    31 + 28 + 31 + 30,
    31 + 28 + 31 + 30 + 31,
    31 + 28 + 31 + 30 + 31 + 30,
    31 + 28 + 31 + 30 + 31 + 30 + 31,
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31,
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30,
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31,
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30,
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30 + 31]
/*
 * counts the number of leap years so far, including this year
 */
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

export function toDateNumber(year: number, month: number, day: number): number {
  const var1 = toDateNumberFromZero(year,month,day)
  const var2 = toDateNumberFromZero(1899,12,30)
  return var1-var2
}

export function dateNumberToMoment(arg: number): Moment {
  let dateNumber = arg + toDateNumberFromZero(1899,12,30)
  let year = Math.floor(dateNumber/365.2425)
  if(toDateNumberFromZero(year+1,1,1) <= dateNumber){
    year++
  }
  else if(toDateNumberFromZero(year-1,1,1) > dateNumber){
    year--
  }

  let dayOfYear = dateNumber - toDateNumberFromZero(year, 1, 1)
  let month = 0
  if(isLeapYear(year) && dayOfYear >= 59) {
    while(prefSumDays[month+1] <= dayOfYear-1) {
      month++
    }
  } else {
    while(prefSumDays[month+1] <= dayOfYear) {
      month++
    }
  }
  let day = dayOfYear - prefSumDays[month]
  return moment({
    year: year,
    month: month,
    day: day+1,
  })
  //return DATE_ZERO.clone().add(dateNumber, 'days')
}

export function dateNumberToDayOfMonth(dateNumber: number): number {
  return dateNumberToMoment(dateNumber).date()
}

export function dateNumberToMonthNumber(dateNumber: number): number {
  return dateNumberToMoment(dateNumber).month() + 1
}

export function dateNumberToYearNumber(dateNumber: number): number {
  return dateNumberToMoment(dateNumber).year()
}

export function momentToDateNumber(date: Moment) {
  return Math.round(date.diff(DATE_ZERO, 'days', true))
}

export function stringToDateNumber(dateString: string, dateFormat: string): number | null {
  const date = moment(dateString, dateFormat, true)
  return date.isValid() ? momentToDateNumber(date) : null
}
