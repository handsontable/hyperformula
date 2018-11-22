import moment  from 'moment'
import { Moment }  from 'moment'

const DATE_ZERO = moment({
  year: 1899,
  month: 11,
  day: 30,
})

const DATE_FORMAT = 'YYYY-MM-DD'

export function toDateNumber(year: number, month: number, day: number): number {
  const date = moment({
    year,
    month: month - 1,
    day,
  })

  return  momentToDateNumber(date)
}

export function dateNumberToMoment(dateNumber: number): Moment {
  return DATE_ZERO.clone().add(dateNumber, 'days')
}

export function dateNumberToString(dateNumber: number): string {
  return dateNumberToMoment(dateNumber).format(DATE_FORMAT)
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

export function stringToDateNumber(dateString: string): number | null {
  const date = moment(dateString, DATE_FORMAT)
  return date.isValid() ? momentToDateNumber(date) : null
}
