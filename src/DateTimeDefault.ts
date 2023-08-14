/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {DateTime, SimpleDate, SimpleTime} from './DateTimeHelper'
import {Maybe} from './Maybe'

//const QUICK_CHECK_REGEXP = new RegExp('^[0-9/.\\-:\\s]+[ap]?m?\\s*$', '')
const QUICK_CHECK_REGEXP = new RegExp('^[0-9/.\\-: ]+[ap]?m?$', '')
const WHITESPACE_REGEXP = new RegExp('\\s+')
const DATE_SEPARATOR_REGEXP = new RegExp('[ /.-]')
const TIME_SEPARATOR = ':'

export function defaultParseToDateTime(text: string, dateFormat?: string, timeFormat?: string): Maybe<DateTime> {
  let dateTimeString = text.replace(WHITESPACE_REGEXP, ' ').trim().toLowerCase()

  if (!doesItLookLikeADateTimeQuickCheck(dateTimeString)) {
    return undefined
  }

  let ampmToken: Maybe<string> = dateTimeString.substring(dateTimeString.length - 2)
  if (ampmToken === 'am' || ampmToken === 'pm') {
    dateTimeString = dateTimeString.substring(0, dateTimeString.length - 2).trim()
  } else {
    ampmToken = dateTimeString.substring(dateTimeString.length - 1)
    if (ampmToken === 'a' || ampmToken === 'p') {
      dateTimeString = dateTimeString.substring(0, dateTimeString.length - 1).trim()
    } else {
      ampmToken = undefined
    }
  }
  const dateItems = dateTimeString.split(DATE_SEPARATOR_REGEXP)
  if (dateItems.length >= 2 && dateItems[dateItems.length - 2].includes(TIME_SEPARATOR)) {
    dateItems[dateItems.length - 2] = dateItems[dateItems.length - 2] + '.' + dateItems[dateItems.length - 1]
    dateItems.pop()
  }
  const timeItems = dateItems[dateItems.length - 1].split(TIME_SEPARATOR)
  if (ampmToken !== undefined) {
    timeItems.push(ampmToken)
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

function doesItLookLikeADateTimeQuickCheck(text: string): boolean {
  return QUICK_CHECK_REGEXP.test(text)
}

export const secondsExtendedRegexp = /^ss(\.(s+|0+))?$/

function defaultParseToTime(timeItems: string[], timeFormat: Maybe<string>): Maybe<SimpleTime> {
  const precision = 1000

  if (timeFormat === undefined) {
    return undefined
  }
  timeFormat = timeFormat.toLowerCase()
  if (timeFormat.endsWith('am/pm')) {
    timeFormat = timeFormat.substring(0, timeFormat.length - 5).trim()
  } else if (timeFormat.endsWith('a/p')) {
    timeFormat = timeFormat.substring(0, timeFormat.length - 3).trim()
  }
  const formatItems = timeFormat.split(TIME_SEPARATOR)
  let ampm = undefined
  if (timeItems[timeItems.length - 1] === 'am' || timeItems[timeItems.length - 1] === 'a') {
    ampm = false
    timeItems.pop()
  } else if (timeItems[timeItems.length - 1] === 'pm' || timeItems[timeItems.length - 1] === 'p') {
    ampm = true
    timeItems.pop()
  }

  if (timeItems.length !== formatItems.length) {
    return undefined
  }

  const hourIndex = formatItems.indexOf('hh')
  const minuteIndex = formatItems.indexOf('mm')
  const secondIndex = formatItems.findIndex(item => secondsExtendedRegexp.test(item))

  const hourString = hourIndex !== -1 ? timeItems[hourIndex] : '0'
  if (!/^\d+$/.test(hourString)) {
    return undefined
  }
  let hours = Number(hourString)
  if (ampm !== undefined) {
    if (hours < 0 || hours > 12) {
      return undefined
    }
    hours = hours % 12
    if (ampm) {
      hours = hours + 12
    }
  }

  const minuteString = minuteIndex !== -1 ? timeItems[minuteIndex] : '0'
  if (!/^\d+$/.test(minuteString)) {
    return undefined
  }
  const minutes = Number(minuteString)

  const secondString = secondIndex !== -1 ? timeItems[secondIndex] : '0'
  if (!/^\d+(\.\d+)?$/.test(secondString)) {
    return undefined
  }

  const seconds = Math.round(Number(secondString) * precision) / precision

  return {hours, minutes, seconds}
}

function defaultParseToDate(dateItems: string[], dateFormat: Maybe<string>): Maybe<SimpleDate> {
  if (dateFormat === undefined) {
    return undefined
  }
  const formatItems = dateFormat.toLowerCase().split(DATE_SEPARATOR_REGEXP)
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

// Ideas:
// - quick check -> 10% speedup
// - parse formats only once
// - divide string into parts by a regexp [date_regexp]? [time_regexp]? [ampm_regexp]?
//   - start by finding the time part, because it is unambiguous '([0-9]+:[0-9:.]+ ?[ap]?m?)$', before it is the date part
//   - OR split by spaces - last segment is ampm token, second to last is time (with or without ampm), rest is date
// - date parsing might work differently after these changes but still according to the docs
// - test edge cases like timeFormats: ['hh', 'ss.ss'] etc, string: '01-01-2019 AM', 'PM'