/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {DateTime, SimpleDate, SimpleTime} from './DateTimeHelper'
import {Maybe} from './Maybe'

export const TIME_FORMAT_SECONDS_ITEM_REGEXP = new RegExp('^ss(\.(s+|0+))?$')

const QUICK_CHECK_REGEXP = new RegExp('^[0-9/.\\-: ]+[ap]?m?$')
const WHITESPACE_REGEXP = new RegExp('\\s+')
const DATE_SEPARATOR_REGEXP = new RegExp('[ /.-]')
const TIME_SEPARATOR = ':'
const SECONDS_PRECISION = 1000

export function defaultParseToDateTime(text: string, dateFormat: Maybe<string>, timeFormat: Maybe<string>): Maybe<DateTime> {
  if (dateFormat === undefined && timeFormat === undefined) {
    return undefined
  }

  let dateTimeString = text.replace(WHITESPACE_REGEXP, ' ').trim().toLowerCase()

  // if (!doesItLookLikeADateTimeQuickCheck(dateTimeString)) {
  //   return undefined
  // }

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

function defaultParseToTime(timeItems: string[], timeFormat: Maybe<string>): Maybe<SimpleTime> {
  if (timeFormat === undefined) {
    return undefined
  }

  const {
    itemsCount,
    hourItem,
    minuteItem,
    secondItem,
  } = memoizedParseTimeFormat(timeFormat)

  let ampm = undefined
  if (timeItems[timeItems.length - 1] === 'am' || timeItems[timeItems.length - 1] === 'a') {
    ampm = false
    timeItems.pop()
  } else if (timeItems[timeItems.length - 1] === 'pm' || timeItems[timeItems.length - 1] === 'p') {
    ampm = true
    timeItems.pop()
  }

  if (timeItems.length !== itemsCount) {
    return undefined
  }

  const hourString = hourItem !== -1 ? timeItems[hourItem] : '0'
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

  const minuteString = minuteItem !== -1 ? timeItems[minuteItem] : '0'
  if (!/^\d+$/.test(minuteString)) {
    return undefined
  }
  const minutes = Number(minuteString)

  const secondString = secondItem !== -1 ? timeItems[secondItem] : '0'
  if (!/^\d+(\.\d+)?$/.test(secondString)) {
    return undefined
  }
  const seconds = Math.round(Number(secondString) * SECONDS_PRECISION) / SECONDS_PRECISION

  return { hours, minutes, seconds }
}

function parseDateFormat(dateFormat: string) {
  const items = dateFormat.toLowerCase().trim().split(DATE_SEPARATOR_REGEXP)

  return {
    itemsCount: items.length,
    dayItem: items.indexOf('dd'),
    monthItem: items.indexOf('mm'),
    shortYearItem: items.indexOf('yy'),
    longYearItem: items.indexOf('yyyy'),
  }
}

function defaultParseToDate(dateItems: string[], dateFormat: Maybe<string>): Maybe<SimpleDate> {
  if (dateFormat === undefined) {
    return undefined
  }
  const {
    itemsCount,
    dayItem,
    monthItem,
    shortYearItem,
    longYearItem,
  } = memoizedParseDateFormat(dateFormat)

  if (dateItems.length !== itemsCount) {
    return undefined
  }
  if (!(monthItem in dateItems) || !(dayItem in dateItems) ||
    (!(longYearItem in dateItems) && !(shortYearItem in dateItems))) {
    return undefined
  }
  if (longYearItem in dateItems && shortYearItem in dateItems) {
    return undefined
  }
  let year
  if (longYearItem in dateItems) {
    const yearString = dateItems[longYearItem]
    if (/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 1000 || year > 9999) {
        return undefined
      }
    } else {
      return undefined
    }
  } else {
    const yearString = dateItems[shortYearItem]
    if (/^\d+$/.test(yearString)) {
      year = Number(yearString)
      if (year < 0 || year > 99) {
        return undefined
      }
    } else {
      return undefined
    }
  }
  const monthString = dateItems[monthItem]
  if (!/^\d+$/.test(monthString)) {
    return undefined
  }
  const month = Number(monthString)
  const dayString = dateItems[dayItem]
  if (!/^\d+$/.test(dayString)) {
    return undefined
  }
  const day = Number(dayString)
  return {year, month, day}
}

function doesItLookLikeADateTimeQuickCheck(text: string): boolean {
  return QUICK_CHECK_REGEXP.test(text)
}

function parseTimeFormat(timeFormat: string): { itemsCount: number, hourItem: number, minuteItem: number, secondItem: number } {
  const formatLowercase = timeFormat.toLowerCase().trim()
  const formatWithoutAmPmItem = formatLowercase.endsWith('am/pm')
    ? formatLowercase.substring(0, formatLowercase.length - 5)
    : (formatLowercase.endsWith('a/p')
      ? formatLowercase.substring(0, timeFormat.length - 3)
      : formatLowercase)

  const items = formatWithoutAmPmItem.trim().split(TIME_SEPARATOR)
  return {
    itemsCount: items.length,
    hourItem: items.indexOf('hh'),
    minuteItem: items.indexOf('mm'),
    secondItem: items.findIndex(item => TIME_FORMAT_SECONDS_ITEM_REGEXP.test(item)),
  }
}

const memoizedParseTimeFormat = memoize(parseTimeFormat)
const memoizedParseDateFormat = memoize(parseDateFormat)

function memoize<T>(fn: (arg: string) => T) {
  const memoizedResults: {[key: string]: T} = {}

  return (arg: string) => {
    const memoizedResult = memoizedResults[arg]
    if (memoizedResult !== undefined) {
      return memoizedResult
    }

    const result = fn(arg)
    memoizedResults[arg] = result
    return result
  }
}

// Ideas:
// - quick check -> 10% speedup
// - parse formats only once
// - divide string into parts by a regexp [date_regexp]? [time_regexp]? [ampm_regexp]?
//   - start by finding the time part, because it is unambiguous '([0-9]+:[0-9:.]+ ?[ap]?m?)$', before it is the date part
//   - OR split by spaces - last segment is ampm token, second to last is time (with or without ampm), rest is date
// - date parsing might work differently after these changes but still according to the docs
// - test edge cases like timeFormats: ['hh', 'ss.ss'] etc, string: '01-01-2019 AM', 'PM'