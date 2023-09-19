/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {DateTime, SimpleDate, SimpleTime} from './DateTimeHelper'
import {Maybe} from './Maybe'

export const TIME_FORMAT_SECONDS_ITEM_REGEXP = new RegExp('^ss(\\.(s+|0+))?$')

const QUICK_CHECK_REGEXP = new RegExp('^[0-9/.\\-: ]+[ap]?m?$')
const WHITESPACE_REGEXP = new RegExp('\\s+')
const DATE_SEPARATOR_REGEXP = new RegExp('[ /.-]')
const TIME_SEPARATOR = ':'
const SECONDS_PRECISION = 1000
const memoizedParseTimeFormat = memoize(parseTimeFormat)
const memoizedParseDateFormat = memoize(parseDateFormat)

/**
 * Parses a DateTime value from a string if the string matches the given date format and time format.
 *
 * Idea for more readable implementation:
 *   - divide string into parts by a regexp [date_regexp]? [time_regexp]? [ampm_regexp]?
 *   - start by finding the time part, because it is unambiguous '([0-9]+:[0-9:.]+ ?[ap]?m?)$', before it is the date part
 *   - OR split by spaces - last segment is ampm token, second to last is time (with or without ampm), rest is date
 * If applied:
 *   - date parsing might work differently after these changes but still according to the docs
 *   - make sure to test edge cases like timeFormats: ['hh', 'ss.ss'] etc, string: '01-01-2019 AM', 'PM'
 */
export function defaultParseToDateTime(text: string, dateFormat: Maybe<string>, timeFormat: Maybe<string>): Maybe<DateTime> {
  if (dateFormat === undefined && timeFormat === undefined) {
    return undefined
  }

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

/**
 * Parses a time value from a string if the string matches the given time format.
 */
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

  const secondsParsed = Number(timeItems[secondItem] ?? '0')
  if (!Number.isFinite(secondsParsed)) {
    return undefined
  }
  const seconds = Math.round(secondsParsed * SECONDS_PRECISION) / SECONDS_PRECISION

  const minutes = Number(timeItems[minuteItem] ?? '0')
  if (!(Number.isFinite(minutes) && Number.isInteger(minutes))) {
    return undefined
  }

  const hoursParsed = Number(timeItems[hourItem] ?? '0')
  if (!(Number.isFinite(hoursParsed) && Number.isInteger(hoursParsed))) {
    return undefined
  }

  if (ampm !== undefined && (hoursParsed < 0 || hoursParsed > 12)) {
    return undefined
  }

  const hours = ampm !== undefined
    ? hoursParsed % 12 + (ampm ? 12 : 0)
    : hoursParsed

  return { hours, minutes, seconds }
}

/**
 * Parses a date value from a string if the string matches the given date format.
 */
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

  const day = Number(dateItems[dayItem])
  if (!(Number.isFinite(day) && Number.isInteger(day))) {
    return undefined
  }

  const month = Number(dateItems[monthItem])
  if (!(Number.isFinite(month) && Number.isInteger(month))) {
    return undefined
  }

  if (dateItems[longYearItem] && dateItems[shortYearItem]) {
    return undefined
  }

  const year = Number(dateItems[longYearItem] ?? dateItems[shortYearItem])
  if (!(Number.isFinite(year) && Number.isInteger(year))) {
    return undefined
  }

  if (dateItems[longYearItem] && (year < 1000 || year > 9999)) {
    return undefined
  }

  if (dateItems[shortYearItem] && (year < 0 || year > 99)) {
    return undefined
  }

  return { year, month, day }
}

/**
 * Parses a time format string into a format object.
 */
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

/**
 * Parses a date format string into a format object.
 */
function parseDateFormat(dateFormat: string): { itemsCount: number, dayItem: number, monthItem: number, shortYearItem: number, longYearItem: number } {
  const items = dateFormat.toLowerCase().trim().split(DATE_SEPARATOR_REGEXP)

  return {
    itemsCount: items.length,
    dayItem: items.indexOf('dd'),
    monthItem: items.indexOf('mm'),
    shortYearItem: items.indexOf('yy'),
    longYearItem: items.indexOf('yyyy'),
  }
}

/**
 * If this function returns false, the string is not parsable as a date time. Otherwise, it might be.
 * This is a quick check that is used to avoid running the more expensive parsing operations.
 */
function doesItLookLikeADateTimeQuickCheck(text: string): boolean {
  return QUICK_CHECK_REGEXP.test(text)
}

/**
 * Function memoization for improved performance.
 */
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
