/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Date and time" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`. The `examples` and parameter
 * descriptions are hand-authored; re-running that script overwrites them.
 */
export const DATE_AND_TIME_DOCS: Record<string, FunctionDoc> = {
  DATE: {
    category: 'Date and time',
    shortDescription: 'Returns the specified date as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [{name: 'year', description: 'The year of the date; values below HyperFormula\'s epoch year (derived from `nullDate`) are added to that epoch year.'}, {name: 'month', description: 'The month of the date. Values outside 1-12 roll over into adjacent years.'}, {name: 'day', description: 'The day of the month. Values outside the month\'s range roll over into adjacent months.'}],
    examples: ['=DATE(2020, 1, 15)', '=DATE(2020, 13, 1)'],
  },
  DATEDIF: {
    category: 'Date and time',
    shortDescription: 'Calculates distance between two dates.<br>Supported units: "D" (days), "M" (months), "Y" (years), "MD" (days ignoring months and years), "YM" (months ignoring years), or "YD" (days ignoring years).',
    parameters: [{name: 'date1', description: 'The earlier (start) date of the period; must not be later than Date2.'}, {name: 'date2', description: 'The later (end) date of the period.'}, {name: 'unit', description: 'A code selecting the unit of the result: "D", "M", "Y", "MD", "YM", or "YD".'}],
    examples: ['=DATEDIF(DATE(2020,1,1), DATE(2020,6,15), "M")', '=DATEDIF(A1, A2, "D")'],
  },
  DATEVALUE: {
    category: 'Date and time',
    shortDescription: 'Parses a date string and returns it as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).<br>Accepts formats set by the [`dateFormats`](../api/interfaces/configparams.md#dateformats) option.',
    parameters: [{name: 'date_string', description: 'A text string representing a date, in one of the formats configured via `dateFormats`.'}],
    examples: ['=DATEVALUE("30/03/2020")', '=DATEVALUE("31/12/2020")'],
  },
  DAY: {
    category: 'Date and time',
    shortDescription: 'Returns the day of the given date value.',
    parameters: [{name: 'number', description: 'A date value (serial number of days since `nullDate`) whose day-of-month is returned.'}],
    examples: ['=DAY(DATE(2020, 3, 30))', '=DAY(A1)'],
  },
  DAYS: {
    category: 'Date and time',
    shortDescription: 'Calculates the difference between two date values.',
    parameters: [{name: 'date2', description: 'The end (more recent) date value.'}, {name: 'date1', description: 'The start (earlier) date value; the result is Date2 minus Date1, in days.'}],
    examples: ['=DAYS(DATE(2020,3,31), DATE(2020,3,1))', '=DAYS(A2, A1)'],
  },
  DAYS360: {
    category: 'Date and time',
    shortDescription: 'Calculates the difference between two date values in days, in 360-day basis.',
    parameters: [{name: 'date2', description: 'The start date of the 360-day (30-day-month) period.'}, {name: 'date1', description: 'The end date of the 360-day period; the result is Date1 minus Date2 measured with 30-day months.'}, {name: 'format', description: 'TRUE uses the European 30/360 method; FALSE (default) uses the US (NASD) method.'}],
    examples: ['=DAYS360(DATE(2020,3,1), DATE(2020,3,31))', '=DAYS360(A1, A2, TRUE())'],
  },
  EDATE: {
    category: 'Date and time',
    shortDescription: 'Shifts the given startdate by given number of months and returns it as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).[^non-odff]',
    parameters: [{name: 'start_date', description: 'The date value to shift.'}, {name: 'months', description: 'The number of months to shift Startdate by; negative values shift backwards.'}],
    examples: ['=EDATE(A1, 3)', '=EDATE(DATE(2020, 1, 15), -2)'],
  },
  EOMONTH: {
    category: 'Date and time',
    shortDescription: 'Returns the date of the last day of a month which falls months away from the start date. Returns the value in the form of number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).[^non-odff]',
    parameters: [{name: 'start_date', description: 'The date value to start counting from.'}, {name: 'months', description: 'The number of months to add to Startdate before finding the end of that month; negative values go backwards.'}],
    examples: ['=EOMONTH(A1, 1)', '=EOMONTH(DATE(2020, 1, 15), 0)'],
  },
  HOUR: {
    category: 'Date and time',
    shortDescription: 'Returns hour component of given time.',
    parameters: [{name: 'time', description: 'A time value (fraction of a full day) whose hour component is returned.'}],
    examples: ['=HOUR(TIME(14, 30, 0))', '=HOUR(A1)'],
  },
  INTERVAL: {
    category: 'Date and time',
    shortDescription: 'Returns interval string from given number of seconds.',
    parameters: [{name: 'seconds', description: 'The total number of seconds to convert into an ISO 8601 duration string.'}],
    examples: ['=INTERVAL(3665)', '=INTERVAL(A1)'],
  },
  ISOWEEKNUM: {
    category: 'Date and time',
    shortDescription: 'Returns an ISO week number that corresponds to the week of year.',
    parameters: [{name: 'date', description: 'The date value whose ISO-8601 week number (Monday-based) is returned.'}],
    examples: ['=ISOWEEKNUM(DATE(2020, 1, 1))', '=ISOWEEKNUM(A1)'],
  },
  MINUTE: {
    category: 'Date and time',
    shortDescription: 'Returns minute component of given time.',
    parameters: [{name: 'time', description: 'A time value (fraction of a full day) whose minute component is returned.'}],
    examples: ['=MINUTE(TIME(14, 30, 0))', '=MINUTE(A1)'],
  },
  MONTH: {
    category: 'Date and time',
    shortDescription: 'Returns the month for the given date value.',
    parameters: [{name: 'number', description: 'A date value (serial number of days since `nullDate`) whose month is returned.'}],
    examples: ['=MONTH(DATE(2020, 3, 30))', '=MONTH(A1)'],
  },
  NETWORKDAYS: {
    category: 'Date and time',
    shortDescription: 'Returns the number of working days between two given dates.',
    parameters: [{name: 'date1', description: 'The start date of the range.'}, {name: 'date2', description: 'The end date of the range.'}, {name: 'holidays', description: 'An optional range of dates to exclude from the working-day count, in addition to weekends (Saturday and Sunday).'}],
    examples: ['=NETWORKDAYS(A1, A2)', '=NETWORKDAYS(DATE(2020,1,1), DATE(2020,1,31), C1:C3)'],
  },
  'NETWORKDAYS.INTL': {
    category: 'Date and time',
    shortDescription: 'Returns the number of working days between two given dates.',
    parameters: [{name: 'date1', description: 'The start date of the range.'}, {name: 'date2', description: 'The end date of the range.'}, {name: 'mode', description: 'A weekend code (1-7, 11-17; default 1 for Saturday/Sunday) or a 7-character string of 0s and 1s marking weekend days, starting from Monday.'}, {name: 'holidays', description: 'An optional range of dates to exclude from the working-day count, in addition to the weekend days.'}],
    examples: ['=NETWORKDAYS.INTL(A1, A2, 2)', '=NETWORKDAYS.INTL(DATE(2020,1,1), DATE(2020,1,31), "0000011", C1:C3)'],
  },
  NOW: {
    category: 'Date and time',
    shortDescription: 'Returns current date + time as a number of days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [],
    examples: ['=NOW()'],
  },
  SECOND: {
    category: 'Date and time',
    shortDescription: 'Returns second component of given time.',
    parameters: [{name: 'time', description: 'A time value (fraction of a full day) whose second component is returned.'}],
    examples: ['=SECOND(TIME(14, 30, 45))', '=SECOND(A1)'],
  },
  TIME: {
    category: 'Date and time',
    shortDescription: 'Returns the number that represents a given time as a fraction of full day.',
    parameters: [{name: 'hour', description: 'The hour component of the time.'}, {name: 'minute', description: 'The minute component of the time.'}, {name: 'second', description: 'The second component of the time.'}],
    examples: ['=TIME(14, 30, 0)', '=TIME(A1, A2, A3)'],
  },
  TIMEVALUE: {
    category: 'Date and time',
    shortDescription: 'Parses a time string and returns a number that represents it as a fraction of a full day.<br>Accepts formats set by the [`timeFormats`](../api/interfaces/configparams.md#timeformats) option.',
    parameters: [{name: 'time_string', description: 'A text string representing a time, in one of the formats configured via `timeFormats`.'}],
    examples: ['=TIMEVALUE("14:30:00")', '=TIMEVALUE(A1)'],
  },
  TODAY: {
    category: 'Date and time',
    shortDescription: 'Returns an integer representing the current date as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [],
    examples: ['=TODAY()'],
  },
  WEEKDAY: {
    category: 'Date and time',
    shortDescription: 'Computes a number between 1-7 representing the day of week.',
    parameters: [{name: 'date', description: 'The date value whose day of the week is returned.'}, {name: 'type', description: 'A code selecting the numbering scheme (default 1: Sunday=1; 2: Monday=1; 3: Monday=0; 11-17: week starting on each successive weekday, numbered 1-7).'}],
    examples: ['=WEEKDAY(DATE(2020, 1, 1))', '=WEEKDAY(A1, 2)'],
  },
  WEEKNUM: {
    category: 'Date and time',
    shortDescription: 'Returns a week number that corresponds to the week of year.',
    parameters: [{name: 'date', description: 'The date value whose week-of-year number is returned.'}, {name: 'type', description: 'A code selecting which weekday starts the week (default 1: Sunday; 2: Monday; 11-17: each successive weekday; 21: ISO week numbering, Monday-based).'}],
    examples: ['=WEEKNUM(DATE(2020, 3, 15))', '=WEEKNUM(A1, 21)'],
  },
  WORKDAY: {
    category: 'Date and time',
    shortDescription: 'Returns the working day number of days from start day.',
    parameters: [{name: 'date', description: 'The start date to count from.'}, {name: 'shift', description: 'The number of working days to add (positive) or subtract (negative), skipping weekends (Saturday and Sunday).'}, {name: 'holidays', description: 'An optional range of dates to also skip, in addition to weekends.'}],
    examples: ['=WORKDAY(A1, 10)', '=WORKDAY(DATE(2020,1,1), 5, C1:C3)'],
  },
  'WORKDAY.INTL': {
    category: 'Date and time',
    shortDescription: 'Returns the working day number of days from start day.',
    parameters: [{name: 'date', description: 'The start date to count from.'}, {name: 'shift', description: 'The number of working days to add (positive) or subtract (negative).'}, {name: 'mode', description: 'A weekend code (1-7, 11-17; default 1 for Saturday/Sunday) or a 7-character string of 0s and 1s marking weekend days, starting from Monday.'}, {name: 'holidays', description: 'An optional range of dates to also skip, in addition to the weekend days.'}],
    examples: ['=WORKDAY.INTL(A1, 10, 2)', '=WORKDAY.INTL(DATE(2020,1,1), 5, "0000011", C1:C3)'],
  },
  YEAR: {
    category: 'Date and time',
    shortDescription: 'Returns the year as a number according to the internal calculation rules.',
    parameters: [{name: 'number', description: 'A date value (serial number of days since `nullDate`) whose year is returned.'}],
    examples: ['=YEAR(DATE(2020, 3, 30))', '=YEAR(A1)'],
  },
  YEARFRAC: {
    category: 'Date and time',
    shortDescription: 'Computes the difference between two date values, in fraction of years.',
    parameters: [{name: 'date2', description: 'One of the two boundary dates of the period; HyperFormula automatically reorders Date1/Date2 so the result is never negative.'}, {name: 'date1', description: 'The other boundary date of the period.'}, {name: 'format', description: 'A basis code selecting the day-count convention: 0 = US 30/360 (default), 1 = actual/actual, 2 = actual/360, 3 = actual/365, or 4 = European 30/360.'}],
    examples: ['=YEARFRAC(DATE(2020,1,1), DATE(2020,7,1))', '=YEARFRAC(A1, A2, 1)'],
  },
}
