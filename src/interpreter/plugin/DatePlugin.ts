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
      method: 'date'
    },
    'MONTH': {
      method: 'month'
    },
    'YEAR': {
      method: 'year'
    },
    'TEXT': {
      method: 'text'
    },
    'EOMONTH': {
      method: 'eomonth'
    },
    'DAY': {
      method: 'day'
    },
    'DAYS': {
      method: 'days'
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
    if (ast.args.length !== 3) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const year = this.evaluateAst(ast.args[0], formulaAddress)
    const month = this.evaluateAst(ast.args[1], formulaAddress)
    const day = this.evaluateAst(ast.args[2], formulaAddress)
    if (year instanceof SimpleRangeValue || month instanceof SimpleRangeValue || day instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedYear = this.coerceScalarToNumberOrError(year)
    const coercedMonth = this.coerceScalarToNumberOrError(month)
    const coercedDay = this.coerceScalarToNumberOrError(day)

    if (coercedYear instanceof CellError) {
      return coercedYear
    }

    if (coercedMonth instanceof CellError) {
      return coercedMonth
    }

    if (coercedDay instanceof CellError) {
      return coercedDay
    }
    const d = Math.trunc(coercedDay)
    let m = Math.trunc(coercedMonth)
    let y = Math.trunc(coercedYear)
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
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = this.coerceScalarToNumberOrError(arg)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    const numberOfMonthsToShiftValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (numberOfMonthsToShiftValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const numberOfMonthsToShift = this.coerceScalarToNumberOrError(numberOfMonthsToShiftValue)
    if (numberOfMonthsToShift instanceof CellError) {
      return numberOfMonthsToShift
    }

    const date = this.interpreter.dateHelper.numberToDate(dateNumber)
    return this.interpreter.dateHelper.dateToNumber(endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = this.coerceScalarToNumberOrError(arg)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }
    return this.interpreter.dateHelper.numberToDate(dateNumber).day
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const endDate = this.evaluateAst(ast.args[0], formulaAddress)
    if (endDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const endDateNumber = this.coerceScalarToNumberOrError(endDate)
    if (endDateNumber instanceof CellError) {
      return endDateNumber
    }

    const startDate = this.evaluateAst(ast.args[1], formulaAddress)
    if (startDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const startDateNumber = this.coerceScalarToNumberOrError(startDate)
    if (startDateNumber instanceof CellError) {
      return startDateNumber
    }

    return endDateNumber - startDateNumber
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
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = this.coerceScalarToNumberOrError(arg)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return this.interpreter.dateHelper.numberToDate(dateNumber).month
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
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = this.coerceScalarToNumberOrError(arg)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return this.interpreter.dateHelper.numberToDate(dateNumber).year
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
