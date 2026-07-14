/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Date and time" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const DATE_AND_TIME_DOCS: Record<string, FunctionDoc> = {
  DATE: {
    category: 'Date and time',
    shortDescription: 'Returns the specified date as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [{name: 'year', description: ''}, {name: 'month', description: ''}, {name: 'day', description: ''}],
  },
  DATEDIF: {
    category: 'Date and time',
    shortDescription: 'Calculates distance between two dates.<br>Supported units: "D" (days), "M" (months), "Y" (years), "MD" (days ignoring months and years), "YM" (months ignoring years), or "YD" (days ignoring years).',
    parameters: [{name: 'date1', description: ''}, {name: 'date2', description: ''}, {name: 'unit', description: ''}],
  },
  DATEVALUE: {
    category: 'Date and time',
    shortDescription: 'Parses a date string and returns it as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).<br>Accepts formats set by the [`dateFormats`](../api/interfaces/configparams.md#dateformats) option.',
    parameters: [{name: 'date_string', description: ''}],
  },
  DAY: {
    category: 'Date and time',
    shortDescription: 'Returns the day of the given date value.',
    parameters: [{name: 'number', description: ''}],
  },
  DAYS: {
    category: 'Date and time',
    shortDescription: 'Calculates the difference between two date values.',
    parameters: [{name: 'date2', description: ''}, {name: 'date1', description: ''}],
  },
  DAYS360: {
    category: 'Date and time',
    shortDescription: 'Calculates the difference between two date values in days, in 360-day basis.',
    parameters: [{name: 'date2', description: ''}, {name: 'date1', description: ''}, {name: 'format', description: ''}],
  },
  EDATE: {
    category: 'Date and time',
    shortDescription: 'Shifts the given startdate by given number of months and returns it as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).[^non-odff]',
    parameters: [{name: 'start_date', description: ''}, {name: 'months', description: ''}],
  },
  EOMONTH: {
    category: 'Date and time',
    shortDescription: 'Returns the date of the last day of a month which falls months away from the start date. Returns the value in the form of number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).[^non-odff]',
    parameters: [{name: 'start_date', description: ''}, {name: 'months', description: ''}],
  },
  HOUR: {
    category: 'Date and time',
    shortDescription: 'Returns hour component of given time.',
    parameters: [{name: 'time', description: ''}],
  },
  INTERVAL: {
    category: 'Date and time',
    shortDescription: 'Returns interval string from given number of seconds.',
    parameters: [{name: 'seconds', description: ''}],
  },
  ISOWEEKNUM: {
    category: 'Date and time',
    shortDescription: 'Returns an ISO week number that corresponds to the week of year.',
    parameters: [{name: 'date', description: ''}],
  },
  MINUTE: {
    category: 'Date and time',
    shortDescription: 'Returns minute component of given time.',
    parameters: [{name: 'time', description: ''}],
  },
  MONTH: {
    category: 'Date and time',
    shortDescription: 'Returns the month for the given date value.',
    parameters: [{name: 'number', description: ''}],
  },
  NETWORKDAYS: {
    category: 'Date and time',
    shortDescription: 'Returns the number of working days between two given dates.',
    parameters: [{name: 'date1', description: ''}, {name: 'date2', description: ''}, {name: 'holidays', description: ''}],
  },
  'NETWORKDAYS.INTL': {
    category: 'Date and time',
    shortDescription: 'Returns the number of working days between two given dates.',
    parameters: [{name: 'date1', description: ''}, {name: 'date2', description: ''}, {name: 'mode', description: ''}, {name: 'holidays', description: ''}],
  },
  NOW: {
    category: 'Date and time',
    shortDescription: 'Returns current date + time as a number of days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [],
  },
  SECOND: {
    category: 'Date and time',
    shortDescription: 'Returns second component of given time.',
    parameters: [{name: 'time', description: ''}],
  },
  TIME: {
    category: 'Date and time',
    shortDescription: 'Returns the number that represents a given time as a fraction of full day.',
    parameters: [{name: 'hour', description: ''}, {name: 'minute', description: ''}, {name: 'second', description: ''}],
  },
  TIMEVALUE: {
    category: 'Date and time',
    shortDescription: 'Parses a time string and returns a number that represents it as a fraction of a full day.<br>Accepts formats set by the [`timeFormats`](../api/interfaces/configparams.md#timeformats) option.',
    parameters: [{name: 'time_string', description: ''}],
  },
  TODAY: {
    category: 'Date and time',
    shortDescription: 'Returns an integer representing the current date as the number of full days since [`nullDate`](../api/interfaces/configparams.md#nulldate).',
    parameters: [],
  },
  WEEKDAY: {
    category: 'Date and time',
    shortDescription: 'Computes a number between 1-7 representing the day of week.',
    parameters: [{name: 'date', description: ''}, {name: 'type', description: ''}],
  },
  WEEKNUM: {
    category: 'Date and time',
    shortDescription: 'Returns a week number that corresponds to the week of year.',
    parameters: [{name: 'date', description: ''}, {name: 'type', description: ''}],
  },
  WORKDAY: {
    category: 'Date and time',
    shortDescription: 'Returns the working day number of days from start day.',
    parameters: [{name: 'date', description: ''}, {name: 'shift', description: ''}, {name: 'holidays', description: ''}],
  },
  'WORKDAY.INTL': {
    category: 'Date and time',
    shortDescription: 'Returns the working day number of days from start day.',
    parameters: [{name: 'date', description: ''}, {name: 'shift', description: ''}, {name: 'mode', description: ''}, {name: 'holidays', description: ''}],
  },
  YEAR: {
    category: 'Date and time',
    shortDescription: 'Returns the year as a number according to the internal calculation rules.',
    parameters: [{name: 'number', description: ''}],
  },
  YEARFRAC: {
    category: 'Date and time',
    shortDescription: 'Computes the difference between two date values, in fraction of years.',
    parameters: [{name: 'date2', description: ''}, {name: 'date1', description: ''}, {name: 'format', description: ''}],
  },
}
