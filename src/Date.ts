import moment  from 'moment'
import { Moment }  from 'moment'
import {Config} from './Config'

const DATE_ZERO = moment({
  year: 1899,
  month: 11,
  day: 30,
})

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

export function dateNumberToString(dateNumber: number, dateFormat: string): string {
  return dateNumberToMoment(dateNumber).format(dateFormat)
}

export function dateNumebrToStringFormat(dateNumber: number, format: string): string {
  return dateNumberToMoment(dateNumber).format(format.toUpperCase())
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
  const date = moment(dateString, dateFormat)
  return date.isValid() ? momentToDateNumber(date) : null
}
