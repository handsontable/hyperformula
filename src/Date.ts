import moment, {Moment} from 'moment'

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
  const date = moment(dateString, dateFormat)
  return date.isValid() ? momentToDateNumber(date) : null
}
