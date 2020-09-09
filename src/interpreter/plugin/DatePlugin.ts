/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {
  instanceOfSimpleDate,
  instanceOfSimpleTime,
  numberToSimpleTime,
  offsetMonth,
  roundToNearestSecond, SimpleDate,
  timeToNumber, toBasisEU,
  truncateDayInMonth
} from '../../DateTimeHelper'
import {ErrorMessage} from '../../error-message'
import {format} from '../../format/format'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing date-specific functions
 */
export class DatePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DATE': {
      method: 'date',
      parameters:  [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    'TIME': {
      method: 'time',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
        ]
    },
    'MONTH': {
      method: 'month',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
    },
    'YEAR': {
      method: 'year',
      parameters:[
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
        ]
    },
    'DAY': {
      method: 'day',
      parameters:  [
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
        ]
    },
    'TIMEVALUE': {
      method: 'timevalue',
      parameters: [
          {argumentType: ArgumentTypes.STRING},
        ]
    },
    'NOW': {
      method: 'now',
      parameters: [],
      isVolatile: true,
    },
    'TODAY': {
      method: 'today',
      parameters: [],
      isVolatile: true,
    },
    'EDATE': {
      method: 'edate',
      parameters: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER},
        ],
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
  }

  /**
   * Corresponds to DATE(year, month, day)
   *
   * Converts a provided year, month and day into date
   *
   * @param ast
   * @param formulaAddress
   */
  public date(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DATE'), (year, month, day) => {
      const d = Math.trunc(day)
      let m = Math.trunc(month)
      let y = Math.trunc(year)
      if (y < this.interpreter.dateHelper.getEpochYearZero()) {
        y += this.interpreter.dateHelper.getEpochYearZero()
      }
      const delta = Math.floor((m - 1) / 12)
      y += delta
      m -= delta * 12

      const date = {year: y, month: m, day: 1}
      if (this.interpreter.dateHelper.isValidDate(date)) {
        const ret = this.interpreter.dateHelper.dateToNumber(date) + (d - 1)
        return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
      }
      return new CellError(ErrorType.VALUE, ErrorMessage.InvalidDate)
    })
  }

  public time(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TIME'),
      (h, m, s) => {
        const ret = timeToNumber({hours: Math.trunc(h), minutes: Math.trunc(m), seconds: Math.trunc(s)})
        if(ret<0) {
          return new CellError(ErrorType.NUM, ErrorMessage.NegativeTime)
        }
        return ret%1
      }
    )
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EOMONTH'), (dateNumber, numberOfMonthsToShift) => {
      const date = this.interpreter.dateHelper.numberToSimpleDate(dateNumber)
      const ret = this.interpreter.dateHelper.dateToNumber(this.interpreter.dateHelper.endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
      return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
    })
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DAY'),
      (dateNumber) => this.interpreter.dateHelper.numberToSimpleDate(dateNumber).day
    )
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DAYS'), (endDate, startDate) => Math.trunc(endDate) - Math.trunc(startDate))
  }

  /**
   * Corresponds to MONTH(date)
   *
   * Returns the month of the year specified by a given date
   *
   * @param ast
   * @param formulaAddress
   */
  public month(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MONTH'),
      (dateNumber) => this.interpreter.dateHelper.numberToSimpleDate(dateNumber).month
    )
  }

  /**
   * Corresponds to YEAR(date)
   *
   * Returns the year specified by a given date
   *
   * @param ast
   * @param formulaAddress
   */
  public year(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('YEAR'),
      (dateNumber) => this.interpreter.dateHelper.numberToSimpleDate(dateNumber).year
    )
  }

  public hour(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HOUR'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber)%1).hours
    )
  }

  public minute(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MINUTE'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber)%1).minutes
    )
  }

  public second(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SECOND'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber)%1).seconds
    )
  }

  /**
   * Corresponds to TEXT(number, format)
   *
   * Tries to convert number to specified date format.
   *
   * @param ast
   * @param formulaAddress
   */
  public text(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TEXT'),
      (numberRepresentation, formatArg) =>format(numberRepresentation, formatArg, this.config, this.interpreter.dateHelper)
    )
  }

  public weekday(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('WEEKDAY'),
      (day: number, type: number) => {
        const absoluteDay = Math.floor(this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(day))
        if(type===3) {
          return (absoluteDay-1)%7
        }
        const offset = weekdayOffsets.get(type)
        if(offset===undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.Weekday)
        }
        return (absoluteDay-offset)%7+1
      }
    )
  }

  public weeknum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('WEEKNUM'),
      (day: number, type: number) => {
        const absoluteDay = Math.floor(this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(day))
        const date = this.interpreter.dateHelper.numberToSimpleDate(day)
        const yearStart = this.interpreter.dateHelper.dateToNumber({year: date.year, month: 1, day: 1})
        const yearStartAbsolute = this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(yearStart)
        if(type === 21) {
          return this.isoweeknumCore(day)
        }
        const offset = weekdayOffsets.get(type)
        if(offset===undefined) {
          return new CellError(ErrorType.NUM, ErrorMessage.Weekday)
        }
        return Math.floor((absoluteDay-offset)/7) - Math.floor((yearStartAbsolute-offset)/7)+1
      }
    )
  }

  public isoweeknum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ISOWEEKNUM'), this.isoweeknumCore)
  }

  private isoweeknumCore = (day: number): number => {
    const absoluteDay = Math.floor(this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(day))
    const date = this.interpreter.dateHelper.numberToSimpleDate(day)
    const yearStart = this.interpreter.dateHelper.dateToNumber({year: date.year, month: 1, day: 1})
    const yearStartAbsolute = this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(yearStart)
    const firstThursdayAbs = yearStartAbsolute + ((4-yearStartAbsolute)%7+7)%7
    const ret = Math.floor((absoluteDay-1)/7) - Math.floor((firstThursdayAbs-1)/7)+1
    if(ret===0) {
      return this.isoweeknumCore(day-7)+1
    }
    return ret
  }

  public datevalue(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DATEVALUE'),
      (date: string) => {
        const dateTime = this.interpreter.dateHelper.parseDateTimeFromConfigFormats(date)
        if(dateTime === undefined) {
          return new CellError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime)
        }
        if(!instanceOfSimpleDate(dateTime)) {
          return 0
        }
        return (instanceOfSimpleTime(dateTime) ? Math.trunc(timeToNumber(dateTime)) : 0) +
          this.interpreter.dateHelper.dateToNumber(dateTime)
      }
    )
  }

  public timevalue(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TIMEVALUE'),
      (date: string) => {
        const dateNumber = this.interpreter.dateHelper.dateStringToDateNumber(date)
        if(dateNumber===undefined){
          return new CellError(ErrorType.VALUE, ErrorMessage.IncorrectDateTime)
        }
        return dateNumber%1
      }
    )
  }

  public now(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('NOW'),
      () => {
        const now = new Date()
        return timeToNumber({hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds()})+
          this.interpreter.dateHelper.dateToNumber({year: now.getFullYear(), month: now.getMonth()+1, day: now.getDay()})
      }
    )
  }

  public today(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TODAY'),
      () => {
        const now = new Date()
        return this.interpreter.dateHelper.dateToNumber({year: now.getFullYear(), month: now.getMonth()+1, day: now.getDay()})
      }
    )
  }

  public edate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EDATE'),
      (dateNumber: number, delta: number) => {
        const date = this.interpreter.dateHelper.numberToSimpleDate(dateNumber)
        const newDate = truncateDayInMonth(offsetMonth(date, delta))
        const ret = this.interpreter.dateHelper.dateToNumber(newDate)
        return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM, ErrorMessage.DateBounds)
      }
    )
  }

  public datedif(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DATEDIF'),
      (startDate: number, endDate: number, unit: string) => {
        if(startDate > endDate) {
          return new CellError(ErrorType.NUM, ErrorMessage.StartEndDate)
        }
        if(unit === 'D') {
          return Math.floor(endDate) - Math.floor(startDate)
        }
        const start = this.interpreter.dateHelper.numberToSimpleDate(startDate)
        const end = this.interpreter.dateHelper.numberToSimpleDate(endDate)
        switch(unit) {
          case 'M':
            return (end.year - start.year)*12 + (end.month-start.month) - (end.day < start.day?1:0)
          case 'YM':
            return (12+(end.month-start.month) - (end.day < start.day?1:0))%12
          case 'Y':
            if((end.month > start.month) || (end.month === start.month && end.day >= start.day)) {
              return end.year - start.year
            } else {
              return end.year - start.year - 1
            }
          case 'MD':
            if(end.day >= start.day) {
              return end.day - start.day
            } else {
              const m = end.month === 1 ? 12 : end.month-1
              const y = end.month === 1 ? end.year-1 : end.year
              return this.interpreter.dateHelper.daysInMonth(y, m)+end.day-start.day
            }
          case 'YD':
            if(end.month > start.month || (end.month === start.month && end.day >= start.day)) {
              return Math.floor(endDate) - this.interpreter.dateHelper.dateToNumber({year: end.year, month: start.month, day: start.day})
            } else {
              return Math.floor(endDate)
                - Math.floor(startDate)
                - 365*(end.year-start.year-1)
                - this.interpreter.dateHelper.leapYearsCount(end.year-1)
                + this.interpreter.dateHelper.leapYearsCount(start.year)
            }
          default:
            return new CellError(ErrorType.NUM, ErrorMessage.Weekday)
        }
      }
    )
  }

  public days360(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DAYS360'), this.days360Core)
  }

  private days360Core = (startDate: number, endDate: number, mode: boolean): number => {
    const start = this.interpreter.dateHelper.numberToSimpleDate(startDate)
    const end = this.interpreter.dateHelper.numberToSimpleDate(endDate)
    let nStart, nEnd: SimpleDate
    if(mode) {
      nStart = toBasisEU(start)
      nEnd = toBasisEU(end)
    } else {
      [nStart, nEnd] = this.interpreter.dateHelper.toBasisUS(start, end)
    }
    return 360 * (nEnd.year - nStart.year) + 30*(nEnd.month-nStart.month) + nEnd.day-nStart.day
  }

  public yearfrac(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('YEARFRAC'),
      (startDate: number, endDate: number, mode: number) => {
        startDate = Math.trunc(startDate)
        endDate = Math.trunc(endDate)
        if(startDate > endDate) {
          [startDate, endDate] = [endDate, startDate]
        }
        switch (mode) {
          case 0:
            return this.days360Core(startDate, endDate, false) / 360
          case 1:
            return (endDate-startDate) / this.interpreter.dateHelper.yearLengthForBasis(
              this.interpreter.dateHelper.numberToSimpleDate(startDate),
              this.interpreter.dateHelper.numberToSimpleDate(endDate)
            )
          case 2:
            return (endDate-startDate)/360
          case 3:
            return (endDate-startDate)/365
          case 4:
            return this.days360Core(startDate, endDate, true) / 360
        }
        throw new Error('Should not be reachable.')
      }
    )
  }
}

const weekdayOffsets = new Map([[1, 0], [2, 1], [11, 1], [12, 2], [13, 3], [14, 4], [15, 5], [16, 6], [17, 0]])
