/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {endOfMonth, offsetMonth, roundToNearestSecond} from '../../DateTimeHelper'
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
    'MONTH': {
      method: 'month',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'YEAR': {
      method: 'year',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'HOUR': {
      method: 'hour',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'MINUTE': {
      method: 'minute',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'SECOND': {
      method: 'second',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
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
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'DAY': {
      method: 'day',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
        ]
      },
    },
    'DAYS': {
      method: 'days',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.NUMBER},
          {argumentType: ArgumentTypes.NUMBER},
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
    'DATEVALUE': {
      method: 'datevalue',
      parameters: {
        list: [
          {argumentType: ArgumentTypes.STRING},
        ]
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
        if (this.interpreter.dateHelper.getWithinBounds(ret)) {
          return ret
        }
      }
      return new CellError(ErrorType.VALUE)
    })
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('EOMONTH'), (dateNumber, numberOfMonthsToShift) => {
      const date = this.interpreter.dateHelper.numberToSimpleDate(dateNumber)
      return this.interpreter.dateHelper.dateToNumber(endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
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
      (timeNumber) => this.interpreter.dateHelper.numberToSimpleTime(roundToNearestSecond(timeNumber)%1).hours
    )
  }

  public minute(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('MINUTE'),
      (timeNumber) => this.interpreter.dateHelper.numberToSimpleTime(roundToNearestSecond(timeNumber)%1).minutes
    )
  }

  public second(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SECOND'),
      (timeNumber) => this.interpreter.dateHelper.numberToSimpleTime(roundToNearestSecond(timeNumber)%1).seconds
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
      const absoluteDay = this.interpreter.dateHelper.relativeNumberToAbsoluteNumber(day)
        if(type===3) {
          return (Math.trunc(absoluteDay)+6)%7
        }
        const offset = weekdayOffsets.get(type)
        return offset===undefined ? new CellError(ErrorType.NUM) : (Math.trunc(absoluteDay)+offset)%7+1
      }
    )
  }

  public datevalue(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('DATEVALUE'),
      (date: string) => {
        const dateNumber = this.interpreter.dateHelper.dateStringToDateNumber(date)
        if(dateNumber===undefined){
          return new CellError(ErrorType.VALUE)
        }
        return Math.trunc(dateNumber)
      }
    )
  }
}

const weekdayOffsets = new Map([[1, 0], [2, 6], [11, 6], [12, 5], [13, 4], [14, 3], [15, 2], [16, 1], [17, 0]])
