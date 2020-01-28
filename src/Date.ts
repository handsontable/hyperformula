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
    31 + 28 + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30]
/*
 * counts the number of leap years so far, including this year
 */
function leapYearsCount(year: number): number {
  return Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400)
}


export function toDateNumberFromZero(year: number, month: number, day: number): number {
  return 365*year + prefSumDays[month-1] + day-1 + (month<=2 ? leapYearsCount(year - 1) : leapYearsCount(year))
}

export function toDateNumber(year: number, month: number, day: number): number {
  return toDateNumberFromZero(year,month,day) - toDateNumberFromZero(1899,12,30)
}

export function dateNumberToMoment(dateNumber: number): Moment {
  return DATE_ZERO.clone().add(dateNumber, 'days')
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

export function daysBetween(endDateNumber: number, startDateNumber: number): number {
  const endDate = dateNumberToMoment(endDateNumber)
  const startDate = dateNumberToMoment(startDateNumber)

  return endDate.diff(startDate, 'day')
}

export function momentToDateNumber(date: Moment) {
  return Math.round(date.diff(DATE_ZERO, 'days', true))
}

export function stringToDateNumber(dateString: string, dateFormat: string): number | null {
  const date = moment(dateString, dateFormat, true)
  return date.isValid() ? momentToDateNumber(date) : null
}
