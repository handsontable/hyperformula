/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {
  endOfMonth,
  instanceOfSimpleDate,
  instanceOfSimpleTime,
  numberToSimpleTime,
  offsetMonth,
  roundToNearestSecond,
  timeToNumber,
  truncateDayInMonth
} from '../../DateTimeHelper'
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
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'TIME': {
      method: 'time',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'MONTH': {
      method: 'month',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'YEAR': {
      method: 'year',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'HOUR': {
      method: 'hour',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'MINUTE': {
      method: 'minute',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'SECOND': {
      method: 'second',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'TEXT': {
      method: 'text',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.STRING},
        ]
      },
    },
    'EOMONTH': {
      method: 'eomonth',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'DAY': {
      method: 'day',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'DAYS': {
      method: 'days',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'WEEKDAY': {
      method: 'weekday',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
        ]
      },
    },
    'WEEKNUM': {
      method: 'weeknum',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
          {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
        ]
      },
    },
    'ISOWEEKNUM': {
      method: 'isoweeknum',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER, minValue: 0},
        ]
      },
    },
    'DATEVALUE': {
      method: 'datevalue',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.STRING},
        ]
      },
    },
    'TIMEVALUE': {
      method: 'timevalue',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.STRING},
        ]
      },
    },
    'NOW': {
      method: 'now',
      parameters: {
        list: [],
      },
      isVolatile: true,
    },
    'TODAY': {
      method: 'today',
      parameters: {
        list: [],
      },
      isVolatile: true,
    },
    'EDATE': {
      method: 'edate',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
        ],
      },
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('DATE'), (year, month, day) => {
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
        return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM)
      }
      return new CellError(ErrorType.VALUE)
    })
  }

  public time(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('TIME'),
      (h, m, s) => timeToNumber({hours: Math.trunc(h), minutes: Math.trunc(m), seconds: Math.trunc(s)})%1
    )
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('EOMONTH'), (dateNumber, numberOfMonthsToShift) => {
      const date = this.interpreter.dateHelper.numberToSimpleDate(dateNumber)
      const ret = this.interpreter.dateHelper.dateToNumber(endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
      return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM)
    })
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DAY'),
      (dateNumber) => this.interpreter.dateHelper.numberToSimpleDate(dateNumber).day
    )
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DAYS'), (endDate, startDate) => Math.trunc(endDate) - Math.trunc(startDate))
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('MONTH'),
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('YEAR'),
      (dateNumber) => this.interpreter.dateHelper.numberToSimpleDate(dateNumber).year
    )
  }

  public hour(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('HOUR'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber)%1).hours
    )
  }

  public minute(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('MINUTE'),
      (timeNumber) => numberToSimpleTime(roundToNearestSecond(timeNumber)%1).minutes
    )
  }

  public second(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SECOND'),
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('TEXT'),
      (numberRepresentation, formatArg) =>format(numberRepresentation, formatArg, this.config, this.interpreter.dateHelper)
    )
  }

  public weekday(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('WEEKDAY'),
      (day: number, type: number) => {
        const absoluteDay = Math.floor(this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(day))
        if(type===3) {
          return (absoluteDay-1)%7
        }
        const offset = weekdayOffsets.get(type)
        if(offset===undefined) {
          return new CellError(ErrorType.NUM)
        }
        return (absoluteDay-offset)%7+1
      }
    )
  }

  public weeknum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('WEEKNUM'),
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
          return new CellError(ErrorType.NUM)
        }
        return Math.floor((absoluteDay-offset)/7) - Math.floor((yearStartAbsolute-offset)/7)+1
      }
    )
  }

  public isoweeknum(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISOWEEKNUM'), this.isoweeknumCore)
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('DATEVALUE'),
      (date: string) => {
        const dateTime = this.interpreter.dateHelper.parseDateTimeFromConfigFormats(date)
        if(dateTime === undefined) {
          return new CellError(ErrorType.VALUE)
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('TIMEVALUE'),
      (date: string) => {
        const dateNumber = this.interpreter.dateHelper.dateStringToDateNumber(date)
        if(dateNumber===undefined){
          return new CellError(ErrorType.VALUE)
        }
        return dateNumber%1
      }
    )
  }

  public now(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('NOW'),
      () => {
        const now = new Date()
        return timeToNumber({hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds()})+
          this.interpreter.dateHelper.dateToNumber({year: now.getFullYear(), month: now.getMonth()+1, day: now.getDay()})
      }
    )
  }

  public today(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('TODAY'),
      () => {
        const now = new Date()
        return this.interpreter.dateHelper.dateToNumber({year: now.getFullYear(), month: now.getMonth()+1, day: now.getDay()})
      }
    )
  }

  public edate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('EDATE'),
      (dateNumber: number, delta: number) => {
        const date = this.interpreter.dateHelper.numberToSimpleDate(dateNumber)
        const newDate = truncateDayInMonth(offsetMonth(date, delta))
        const ret = this.interpreter.dateHelper.dateToNumber(newDate)
        return this.interpreter.dateHelper.getWithinBounds(ret) ?? new CellError(ErrorType.NUM)
      }
    )
  }
}

const weekdayOffsets = new Map([[1, 0], [2, 1], [11, 1], [12, 2], [13, 3], [14, 4], [15, 5], [16, 6], [17, 0]])
