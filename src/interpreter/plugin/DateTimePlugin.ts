/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {
  instanceOfSimpleDate,
  instanceOfSimpleTime,
  numberToSimpleTime,
  offsetMonth,
  roundToNearestSecond,
  SimpleDate,
  timeToNumber,
  toBasisEU,
  truncateDayInMonth
} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'
import {format} from '../../format/format'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {
  EmptyValue,
  getRawValue,
  InternalNoErrorScalarValue,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
  RawNoErrorScalarValue,
  RawScalarValue,
} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing date-specific functions
 */
export class DateTimePlugin extends FunctionPlugin implements FunctionPluginTypecheck<DateTimePlugin> {
  public static implementedFunctions = {
    'DATE': {
      method: 'date',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_DATE
    },
    'TIME': {
      method: 'time',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_TIME
    },
    'MONTH': {
      method: 'month',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'YEAR': {
      method: 'year',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'HOUR': {
      method: 'hour',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'MINUTE': {
      method: 'minute',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'SECOND': {
      method: 'second',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'TEXT': {
      method: 'text',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.STRING},
      ]
    },
    'EOMONTH': {
      method: 'eomonth',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_DATE
    },
    'DAY': {
      method: 'day',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'DAYS': {
      method: 'days',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'WEEKDAY': {
      method: 'weekday',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'WEEKNUM': {
      method: 'weeknum',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'ISOWEEKNUM': {
      method: 'isoweeknum',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ]
    },
    'DATEVALUE': {
      method: 'datevalue',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
      ],
      returnNumberType: NumberType.NUMBER_DATE
    },
    'TIMEVALUE': {
      method: 'timevalue',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
      ],
      returnNumberType: NumberType.NUMBER_TIME
    },
    'NOW': {
      method: 'now',
      parameters: [],
      isVolatile: true,
      returnNumberType: NumberType.NUMBER_DATETIME
    },
    'TODAY': {
      method: 'today',
      parameters: [],
      isVolatile: true,
      returnNumberType: NumberType.NUMBER_DATE
    },
    'EDATE': {
      method: 'edate',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER},
      ],
      returnNumberType: NumberType.NUMBER_DATE
    },
    'DAYS360': {
      method: 'days360',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.BOOLEAN, defaultValue: false},
      ],
    },
    'DATEDIF': {
      method: 'datedif',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.STRING},
      ],
    },
    'YEARFRAC': {
      method: 'yearfrac',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.INTEGER, defaultValue: 0, minValue: 0, maxValue: 4},
      ],
    },
    'INTERVAL': {
      method: 'interval',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
      ],
    },
    'NETWORKDAYS': {
      method: 'networkdays',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true}
      ],
    },
    'NETWORKDAYS.INTL': {
      method: 'networkdaysintl',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NOERROR, defaultValue: 1},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true}
      ],
    },
    'WORKDAY': {
      method: 'workday',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true}
      ],
    },
    'WORKDAY.INTL': {
      method: 'workdayintl',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NOERROR, defaultValue: 1},
        {argumentType: ArgumentTypes.RANGE, optionalArg: true}
      ],
    },
  }

  /**
   * Corresponds to DATE(year, month, day)
   *
   * Converts a provided year, month and day into date
   *
   * @param ast
   * @param state
   */
  public date(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DATE'), (year, month, day) => {
      const d = Math.trunc(day)
      let m = Math.trunc(month)
      let y = Math.trunc(year)
      if (y < this.dateTimeHelper.getEpochYearZero()) {
        y += this.dateTimeHelper.getEpochYearZero()
      }
      const delta = Math.floor((m - 1) / 12)
      y += delta
      m -= delta * 12

      const date = {year: y, month: m, day: 1}
      if (this.dateTimeHelper.isValidDate(date)) {
        let ret: Maybe<number> = this.dateTimeHelper.dateToNumber(date) + (d - 1)
        ret = this.dateTimeHelper.getWithinBounds(ret)
        if (ret === undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
        }
        return ret
      }
      return new CellError(ErrorType.VALUE, ErrorMessage.InvalidDate)
    })
  }

  public time(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TIME'),
      (h, m, s) => {
        const ret = timeToNumber({hours: Math.trunc(h), minutes: Math.trunc(m), seconds: Math.trunc(s)})
        if (ret < 0) {
          return new CellError(ErrorType.NUM, ErrorMessage.NegativeTime)
        }
        return ret % 1
      }
    )
  }

  public eomonth(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EOMONTH'), (dateNumber, numberOfMonthsToShift) => {
      const date = this.dateTimeHelper.numberToSimpleDate(dateNumber)
      let ret: Maybe<number> = this.dateTimeHelper.dateToNumber(this.dateTimeHelper.endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
      ret = this.dateTimeHelper.getWithinBounds(ret)
      if (ret === undefined) {
        return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
      }
      return ret
    })
  }

  public day(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DAY'),
      (dateNumber) => this.dateTimeHelper.numberToSimpleDate(dateNumber).day
    )
  }

  public days(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DAYS'), (endDate, startDate) => Math.trunc(endDate) - Math.trunc(startDate))
  }

  /**
   * Corresponds to MONTH(date)
   *
   * Returns the month of the year specified by a given date
   *
   * @param ast
   * @param state
   */
  public month(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MONTH'),
      (dateNumber) => this.dateTimeHelper.numberToSimpleDate(dateNumber).month
    )
  }

  /**
   * Corresponds to YEAR(date)
   *
   * Returns the year specified by a given date
   *
   * @param ast
   * @param state
   */
  public year(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('YEAR'),
      (dateNumber) => this.dateTimeHelper.numberToSimpleDate(dateNumber).year
    )
  }

  public hour(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HOUR'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber) % 1).hours
    )
  }

  public minute(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MINUTE'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber) % 1).minutes
    )
  }

  public second(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SECOND'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber) % 1).seconds
    )
  }

  /**
   * Corresponds to TEXT(number, format)
   *
   * Tries to convert number to specified date format.
   *
   * @param ast
   * @param state
   */
  public text(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TEXT'),
      (numberRepresentation, formatArg) => format(numberRepresentation, formatArg, this.config, this.dateTimeHelper)
    )
  }

  public weekday(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WEEKDAY'),
      (day: number, type: number) => {
        const absoluteDay = Math.floor(this.dateTimeHelper.relativeNumberToAbsoluteNumber(day))
        if (type === 3) {
          return (absoluteDay - 1) % 7
        }
        const offset = weekdayOffsets.get(type)
        if (offset === undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.BadMode)
        }
        return (absoluteDay - offset) % 7 + 1
      }
    )
  }

  public weeknum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WEEKNUM'),
      (day: number, type: number) => {
        const absoluteDay = Math.floor(this.dateTimeHelper.relativeNumberToAbsoluteNumber(day))
        const date = this.dateTimeHelper.numberToSimpleDate(day)
        const yearStart = this.dateTimeHelper.dateToNumber({year: date.year, month: 1, day: 1})
        const yearStartAbsolute = this.dateTimeHelper.relativeNumberToAbsoluteNumber(yearStart)
        if (type === 21) {
          return this.isoweeknumCore(day)
        }
        const offset = weekdayOffsets.get(type)
        if (offset === undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.BadMode)
        }
        return Math.floor((absoluteDay - offset) / 7) - Math.floor((yearStartAbsolute - offset) / 7) + 1
      }
    )
  }

  public isoweeknum(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISOWEEKNUM'), this.isoweeknumCore)
  }

  public datevalue(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DATEVALUE'),
      (date: string) => {
        const {dateTime} = this.dateTimeHelper.parseDateTimeFromConfigFormats(date)
        if (dateTime === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime)
        }
        if (!instanceOfSimpleDate(dateTime)) {
          return 0
        }
        return (instanceOfSimpleTime(dateTime) ? Math.trunc(timeToNumber(dateTime)) : 0) +
          this.dateTimeHelper.dateToNumber(dateTime)
      }
    )
  }

  public timevalue(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TIMEVALUE'),
      (date: string) => {
        const dateNumber = this.dateTimeHelper.dateStringToDateNumber(date)
        if (dateNumber === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime)
        }
        return getRawValue(dateNumber) % 1
      }
    )
  }

  public now(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NOW'),
      () => {
        const now = new Date(Date.now())
        return timeToNumber({hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds()}) +
          this.dateTimeHelper.dateToNumber({year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate()})
      }
    )
  }

  public today(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TODAY'),
      () => {
        const now = new Date(Date.now())
        return this.dateTimeHelper.dateToNumber({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate()
        })
      }
    )
  }

  public edate(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EDATE'),
      (dateNumber: number, delta: number) => {
        const date = this.dateTimeHelper.numberToSimpleDate(dateNumber)
        const newDate = truncateDayInMonth(offsetMonth(date, delta))
        let ret: Maybe<number> = this.dateTimeHelper.dateToNumber(newDate)
        ret = this.dateTimeHelper.getWithinBounds(ret)
        if (ret === undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
        }
        return ret
      }
    )
  }

  public datedif(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DATEDIF'),
      (startDate: number, endDate: number, unit: string) => {
        if (startDate > endDate) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if (unit === 'D') {
          return Math.floor(endDate) - Math.floor(startDate)
        }
        const start = this.dateTimeHelper.numberToSimpleDate(startDate)
        const end = this.dateTimeHelper.numberToSimpleDate(endDate)
        switch (unit) {
          case 'M':
            return (end.year - start.year) * 12 + (end.month - start.month) - (end.day < start.day ? 1 : 0)
          case 'YM':
            return (12 + (end.month - start.month) - (end.day < start.day ? 1 : 0)) % 12
          case 'Y':
            if ((end.month > start.month) || (end.month === start.month && end.day >= start.day)) {
              return end.year - start.year
            } else {
              return end.year - start.year - 1
            }
          case 'MD':
            if (end.day >= start.day) {
              return end.day - start.day
            } else {
              const m = end.month === 1 ? 12 : end.month - 1
              const y = end.month === 1 ? end.year - 1 : end.year
              return this.dateTimeHelper.daysInMonth(y, m) + end.day - start.day
            }
          case 'YD':
            if (end.month > start.month || (end.month === start.month && end.day >= start.day)) {
              return Math.floor(endDate) - this.dateTimeHelper.dateToNumber({
                year: end.year,
                month: start.month,
                day: start.day
              })
            } else {
              return Math.floor(endDate)
                - Math.floor(startDate)
                - 365 * (end.year - start.year - 1)
                - this.dateTimeHelper.leapYearsCount(end.year - 1)
                + this.dateTimeHelper.leapYearsCount(start.year)
            }
          default:
            return new CellError(ErrorType.NUM, ErrorMessage.BadMode)
        }
      }
    )
  }

  public days360(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('DAYS360'), this.days360Core)
  }

  public yearfrac(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('YEARFRAC'),
      (startDate: number, endDate: number, mode: number) => {
        startDate = Math.trunc(startDate)
        endDate = Math.trunc(endDate)
        if (startDate > endDate) {
          [startDate, endDate] = [endDate, startDate]
        }
        switch (mode) {
          case 0:
            return this.days360Core(startDate, endDate, false) / 360
          case 1:
            return (endDate - startDate) / this.dateTimeHelper.yearLengthForBasis(
              this.dateTimeHelper.numberToSimpleDate(startDate),
              this.dateTimeHelper.numberToSimpleDate(endDate)
            )
          case 2:
            return (endDate - startDate) / 360
          case 3:
            return (endDate - startDate) / 365
          case 4:
            return this.days360Core(startDate, endDate, true) / 360
        }
        throw new Error('Should not be reachable.')
      }
    )
  }

  public interval(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INTERVAL'),
      (arg: number) => {
        arg = Math.trunc(arg)
        const second = arg % 60
        arg = Math.trunc(arg / 60)
        const minute = arg % 60
        arg = Math.trunc(arg / 60)
        const hour = arg % 24
        arg = Math.trunc(arg / 24)
        const day = arg % 30
        arg = Math.trunc(arg / 30)
        const month = arg % 12
        const year = Math.trunc(arg / 12)

        return 'P' + ((year > 0) ? year + 'Y' : '')
          + ((month > 0) ? month + 'M' : '')
          + ((day > 0) ? day + 'D' : '')
          + 'T'
          + ((hour > 0) ? hour + 'H' : '')
          + ((minute > 0) ? minute + 'M' : '')
          + ((second > 0) ? second + 'S' : '')
      }
    )
  }

  public networkdays(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NETWORKDAYS'),
      (start, end, holidays) => this.networkdayscore(start, end, 1, holidays)
    )
  }

  public networkdaysintl(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('NETWORKDAYS.INTL'),
      (start, end, weekend, holidays) => this.networkdayscore(start, end, weekend, holidays)
    )
  }

  public workday(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WORKDAY'),
      (start, end, holidays) => this.workdaycore(start, end, 1, holidays)
    )
  }

  public workdayintl(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WORKDAY.INTL'),
      (start, end, weekend, holidays) => this.workdaycore(start, end, weekend, holidays)
    )
  }

  private isoweeknumCore = (day: number): number => {
    const absoluteDay = Math.floor(this.dateTimeHelper.relativeNumberToAbsoluteNumber(day))
    const date = this.dateTimeHelper.numberToSimpleDate(day)
    const yearStart = this.dateTimeHelper.dateToNumber({year: date.year, month: 1, day: 1})
    const yearStartAbsolute = this.dateTimeHelper.relativeNumberToAbsoluteNumber(yearStart)
    const firstThursdayAbs = yearStartAbsolute + ((4 - yearStartAbsolute) % 7 + 7) % 7
    const ret = Math.floor((absoluteDay - 1) / 7) - Math.floor((firstThursdayAbs - 1) / 7) + 1
    if (ret === 0) {
      return this.isoweeknumCore(day - 7) + 1
    }
    return ret
  }

  private days360Core = (startDate: number, endDate: number, mode: boolean): number => {
    const start = this.dateTimeHelper.numberToSimpleDate(startDate)
    const end = this.dateTimeHelper.numberToSimpleDate(endDate)
    let nStart, nEnd: SimpleDate
    if (mode) {
      nStart = toBasisEU(start)
      nEnd = toBasisEU(end)
    } else {
      [nStart, nEnd] = this.dateTimeHelper.toBasisUS(start, end)
    }
    return 360 * (nEnd.year - nStart.year) + 30 * (nEnd.month - nStart.month) + nEnd.day - nStart.day
  }

  private networkdayscore(start: number, end: number, weekend: RawNoErrorScalarValue, holidays?: SimpleRangeValue): RawScalarValue {
    start = Math.trunc(start)
    end = Math.trunc(end)
    let multiplier = 1
    if (start > end) {
      [start, end] = [end, start]
      multiplier = -1
    }

    const weekendPattern = computeWeekendPattern(weekend)
    if (weekendPattern instanceof CellError) {
      return weekendPattern
    }

    const filteredHolidays = this.simpleRangeToFilteredHolidays(weekendPattern, holidays)
    if (filteredHolidays instanceof CellError) {
      return filteredHolidays
    }
    return multiplier * this.countWorkdays(start, end, weekendPattern, filteredHolidays)
  }

  private workdaycore(start: number, delta: number, weekend: RawNoErrorScalarValue, holidays?: SimpleRangeValue): RawScalarValue {
    start = Math.trunc(start)
    delta = Math.trunc(delta)

    const weekendPattern = computeWeekendPattern(weekend)
    if (weekendPattern instanceof CellError) {
      return weekendPattern
    }

    const filteredHolidays = this.simpleRangeToFilteredHolidays(weekendPattern, holidays)
    if (filteredHolidays instanceof CellError) {
      return filteredHolidays
    }

    if (delta > 0) {
      let upper = 1
      while (this.countWorkdays(start + 1, start + upper, weekendPattern, filteredHolidays) < delta) {
        upper *= 2
      }
      let lower = 1
      while (lower + 1 < upper) {
        const mid = Math.trunc((lower + upper) / 2)
        if (this.countWorkdays(start + 1, start + mid, weekendPattern, filteredHolidays) < delta) {
          lower = mid
        } else {
          upper = mid
        }
      }
      return start + upper
    } else if (delta < 0) {
      delta *= -1
      let upper = 1
      while (this.countWorkdays(start - upper, start - 1, weekendPattern, filteredHolidays) < delta) {
        upper *= 2
      }
      let lower = 1
      while (lower + 1 < upper) {
        const mid = Math.trunc((lower + upper) / 2)
        if (this.countWorkdays(start - mid, start - 1, weekendPattern, filteredHolidays) < delta) {
          lower = mid
        } else {
          upper = mid
        }
      }
      return start - upper
    } else {
      return start
    }
  }

  private countWorkdays(start: number, end: number, weekendPattern: string, sortedHolidays: number[]): number {
    const absoluteEnd = Math.floor(this.dateTimeHelper.relativeNumberToAbsoluteNumber(end))
    const absoluteStart = Math.floor(this.dateTimeHelper.relativeNumberToAbsoluteNumber(start))
    let ans = 0
    for (let i = 0; i < 7; i++) {
      if (weekendPattern.charAt(i) === '0') {
        ans += Math.floor((absoluteEnd + 6 - i) / 7)
        ans -= Math.floor((absoluteStart - 1 + 6 - i) / 7)
      }
    }

    ans -= lowerBound(end + 1, sortedHolidays) - lowerBound(start, sortedHolidays)

    return ans
  }

  private simpleRangeToFilteredHolidays(weekendPattern: string, holidays?: SimpleRangeValue): number[] | CellError {
    const holidaysArr = holidays?.valuesFromTopLeftCorner() ?? []
    for (const val of holidaysArr) {
      if (val instanceof CellError) {
        return val
      }
    }
    const processedHolidays: number[] = []
    for (const val of holidaysArr as InternalNoErrorScalarValue[]) {
      if (val === EmptyValue) {
        continue
      }
      if (isExtendedNumber(val)) {
        processedHolidays.push(Math.trunc(getRawValue(val)))
      } else {
        return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
      }
    }
    return [...new Set(processedHolidays)].sort((a, b) => a - b)
      .filter((arg) => {
        const val = this.dateTimeHelper.relativeNumberToAbsoluteNumber(arg)
        const i = (val - 1) % 7
        return (weekendPattern.charAt(i) === '0')
      })
  }

}

/**
 * Returns i such that:
 * sortedArray[i-1] < val <= sortedArray[i]
 *
 */
function lowerBound(val: number, sortedArray: number[]): number {
  if (sortedArray.length === 0) {
    return 0
  }
  if (val <= sortedArray[0]) {
    return 0
  }
  if (sortedArray[sortedArray.length - 1] < val) {
    return sortedArray.length
  }
  let lower = 0 //sortedArray[lower] < val
  let upper = sortedArray.length - 1 //sortedArray[upper] >= val
  while (lower + 1 < upper) {
    const mid = Math.floor((upper + lower) / 2)
    if (sortedArray[mid] >= val) {
      upper = mid
    } else {
      lower = mid
    }
  }
  return upper
}

function computeWeekendPattern(weekend: RawNoErrorScalarValue): string | CellError {
  if (typeof weekend !== 'number' && typeof weekend !== 'string') {
    return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
  }
  if (typeof weekend === 'string') {
    if (weekend.length !== 7 || !/^(0|1)*$/.test(weekend) || weekend === '1111111') {
      return new CellError(ErrorType.NUM, ErrorMessage.WeekendString)
    } else {
      return weekend
    }
  } else {
    return workdayPatterns.get(weekend) ?? new CellError(ErrorType.NUM, ErrorMessage.BadMode)
  }
}

const weekdayOffsets = new Map([[1, 0], [2, 1], [11, 1], [12, 2], [13, 3], [14, 4], [15, 5], [16, 6], [17, 0]])

const workdayPatterns = new Map([
  [1, '0000011'],
  [2, '1000001'],
  [3, '1100000'],
  [4, '0110000'],
  [5, '0011000'],
  [6, '0001100'],
  [7, '0000110'],
  [11, '0000001'],
  [12, '1000000'],
  [13, '0100000'],
  [14, '0010000'],
  [15, '0001000'],
  [16, '0000100'],
  [17, '0000010'],
])
