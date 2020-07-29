/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {endOfMonth, offsetMonth} from '../../DateTimeHelper'
import {format} from '../../format/format'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing date-specific functions
 */
export class DatePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'DATE': {
      method: 'date',
      parameters: {
        list: [
          {argumentType: 'number'},
          {argumentType: 'number'},
          {argumentType: 'number'},
        ]
      },
    },
    'MONTH': {
      method: 'month',
      parameters: {
        list: [
          {argumentType: 'number'},
        ]
      },
    },
    'YEAR': {
      method: 'year',
      parameters: {
        list: [
          {argumentType: 'number'},
        ]
      },
    },
    'TEXT': {
      method: 'text',
      parameters: {
        list: [
          {argumentType: 'number'},
          {argumentType: 'string'},
        ]
      },
    },
    'EOMONTH': {
      method: 'eomonth',
      parameters: {
        list: [
          {argumentType: 'number'},
          {argumentType: 'number'},
        ]
      },
    },
    'DAY': {
      method: 'day',
      parameters: {
        list: [
          {argumentType: 'number'},
        ]
      },
    },
    'DAYS': {
      method: 'days',
      parameters: {
        list: [
          {argumentType: 'number'},
          {argumentType: 'number'},
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('DAYS'), (endDate, startDate) => endDate - startDate)
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

  /**
   * Corresponds to TEXT(number, format)
   *
   * Tries to convert number to specified date format.
   *
   * @param ast
   * @param formulaAddress
   */
  public text(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const dateArg = this.evaluateAst(ast.args[0], formulaAddress)
    const formatArg = this.evaluateAst(ast.args[1], formulaAddress)
    if (dateArg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const numberRepresentation = this.coerceScalarToNumberOrError(dateArg)
    if (numberRepresentation instanceof CellError) {
      return numberRepresentation
    }

    if (typeof formatArg !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    return format(numberRepresentation, formatArg, this.config, this.interpreter.dateHelper)
  }
}
