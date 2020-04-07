import {DateTime, SimpleDate, SimpleTime} from './DateTimeHelper'
import {Maybe} from './Maybe'

export function defaultParseToDateTime(dateTimeString: string, dateFormat: string, timeFormat: string): Maybe<DateTime> {
  dateTimeString = dateTimeString.replace(/\s\s+/g, ' ').trim().toLowerCase()
  let ampmtoken: string | undefined = dateTimeString.substring(dateTimeString.length - 2)
  if (ampmtoken === 'am' || ampmtoken === 'pm') {
    dateTimeString = dateTimeString.substring(0, dateTimeString.length - 2).trim()
  } else {
    ampmtoken = undefined
  }
  const dateItems = dateTimeString.split(/[ /.-]/g)
  const timeItems = dateItems[dateItems.length - 1].split(':')
  if (ampmtoken !== undefined) {
    timeItems.push(ampmtoken)
  }

  if (dateItems.length === 1) {
    return defaultParseToTime(timeItems, timeFormat)
  }
  if (timeItems.length === 1) {
    return defaultParseToDate(dateItems, dateFormat)
  }
  const parsedDate = defaultParseToDate(dateItems.slice(0, dateItems.length - 1), dateFormat)
  const parsedTime = defaultParseToTime(timeItems, timeFormat)
  if (parsedDate === undefined) {
    return undefined
  } else if (parsedTime === undefined) {
    return undefined
  } else {
    return {...parsedDate, ...parsedTime}
  }
}

export function defaultParseToTime(timeItems: string[], timeFormat: string): Maybe<SimpleTime> {
  timeFormat = timeFormat.toLowerCase()
  if (timeFormat.length >= 1 && timeFormat.endsWith('a')) {
    timeFormat = timeFormat.substring(0, timeFormat.length - 1).trim()
  }
  const formatItems = timeFormat.split(':')
  let ampm = undefined
  if (timeItems[timeItems.length - 1] === 'am') {
    ampm = false
    timeItems.pop()
  } else if (timeItems[timeItems.length - 1] === 'pm') {
    ampm = true
    timeItems.pop()
  }
  if (timeItems.length !== formatItems.length) {
    return undefined
  }
  const hourIndex = formatItems.indexOf('hh')
  const minuteIndex = formatItems.indexOf('mm')
  const secondIndex = formatItems.indexOf('ss')

  const hourString = hourIndex !== -1 ? timeItems[hourIndex] : '0'
  if (!/^\d+$/.test(hourString)) {
    return undefined
  }
  let hour = Number(hourString)
  if (ampm !== undefined) {
    if (hour < 0 || hour > 12) {
      return undefined
    }
    hour = hour % 12
    if (ampm) {
      hour = hour + 12
    }
  }

  const minuteString = minuteIndex !== -1 ? timeItems[minuteIndex] : '0'
  if (!/^\d+$/.test(minuteString)) {
    return undefined
  }
  const minute = Number(minuteString)

  const secondString = secondIndex !== -1 ? timeItems[secondIndex] : '0'
  if (!/^\d+$/.test(secondString)) {
    return undefined
  }
  const second = Number(secondString)

  return {hour, minute, second}
}

export function defaultParseToDate(dateItems: string[], dateFormat: string): Maybe<SimpleDate> {
  const formatItems = dateFormat.toLowerCase().split(/[ /.-]/g)
  if (dateItems.length !== formatItems.length) {
    return undefined
  }
  const monthIndex = formatItems.indexOf('mm')
  const dayIndex = formatItems.indexOf('dd')
  const yearIndexLong = formatItems.indexOf('yyyy')
  const yearIndexShort = formatItems.indexOf('yy')
  if (!(monthIndex in dateItems) || !(dayIndex in dateItems) ||
    (!(yearIndexLong in dateItems) && !(yearIndexShort in dateItems))) {
    return undefined
  }
  if (yearIndexLong in dateItems && yearIndexShort in dateItems) {
    return undefined
  }
  let year
  if (yearIndexLong in dateItems) {
    const yearString = dateItems[yearIndexLong]
    if (/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 1000 || year > 9999) {
        return undefined
      }
    } else {
      return undefined
    }
  } else {
    const yearString = dateItems[yearIndexShort]
    if (/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 0 || year > 99) {
        return undefined
      }
    } else {
      return undefined
    }
  }
  const monthString = dateItems[monthIndex]
  if (!/^\d+$/.test(monthString)) {
    return undefined
  }
  const month = Number(monthString)
  const dayString = dateItems[dayIndex]
  if (!/^\d+$/.test(dayString)) {
    return undefined
  }
  const day = Number(dayString)
  return {year, month, day}
}
