import moment from 'moment';

const DATE_ZERO = moment({
  year: 1899,
  month: 11,
  day: 30
})

const DATE_FORMAT = 'YYYY-MM-DD'

export function toNumberDate(year: number, month: number, day: number): number {
  const date = moment({
    year: year,
    month: month-1,
    day: day
  })

  const diff = Math.round(date.diff(DATE_ZERO, "days", true))
  return diff
}

export function numberDateToString(date: number): string {
  return DATE_ZERO.clone().add(date, "days").format(DATE_FORMAT)
}

