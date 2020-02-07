import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {
  endOfMonth,
  offsetMonth,
} from '../../DateHelper'
import {format} from '../../format/format'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber} from '../coerce'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing date-specific functions
 */
export class DatePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    date: {
      translationKey: 'DATE',
    },
    month: {
      translationKey: 'MONTH',
    },
    year: {
      translationKey: 'YEAR',
    },
    text: {
      translationKey: 'TEXT',
    },
    eomonth: {
      translationKey: 'EOMONTH',
    },
    day: {
      translationKey: 'DAY',
    },
    days: {
      translationKey: 'DAYS',
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
  public date(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 3) {
      return new CellError(ErrorType.NA)
    }

    const year = this.evaluateAst(ast.args[0], formulaAddress)
    const month = this.evaluateAst(ast.args[1], formulaAddress)
    const day = this.evaluateAst(ast.args[2], formulaAddress)
    if (year instanceof SimpleRangeValue || month instanceof SimpleRangeValue || day instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedYear = coerceScalarToNumber(year, this.interpreter.dateHelper)
    const coercedMonth = coerceScalarToNumber(month, this.interpreter.dateHelper)
    const coercedDay = coerceScalarToNumber(day, this.interpreter.dateHelper)

    if (coercedYear instanceof CellError) {
      return coercedYear
    }

    if (coercedMonth instanceof CellError) {
      return coercedMonth
    }

    if (coercedDay instanceof CellError) {
      return coercedDay
    }
    var d = Math.trunc(coercedDay)
    var m = Math.trunc(coercedMonth)
    var y = Math.trunc(coercedYear)
    const delta = Math.floor( (m-1)/12 )
    y += delta
    m -= delta*12

    const date = {year: y, month: m, day: 1}
    if( this.interpreter.dateHelper.isValidDate(date) ) {
      const ret = this.interpreter.dateHelper.dateToNumber(date)+(d-1)
      if(this.interpreter.dateHelper.getWithinBounds(ret)) {
        return ret
      }
    }
    return new CellError(ErrorType.VALUE)
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.interpreter.dateHelper)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    const numberOfMonthsToShiftValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (numberOfMonthsToShiftValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const numberOfMonthsToShift = coerceScalarToNumber(numberOfMonthsToShiftValue, this.interpreter.dateHelper)
    if (numberOfMonthsToShift instanceof CellError) {
      return numberOfMonthsToShift
    }

    const date = this.interpreter.dateHelper.numberToDate(dateNumber)
    return this.interpreter.dateHelper.dateToNumber(endOfMonth(offsetMonth(date, numberOfMonthsToShift)))
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.interpreter.dateHelper)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }
    return this.interpreter.dateHelper.dateNumberToDayNumber(dateNumber)
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const endDate = this.evaluateAst(ast.args[0], formulaAddress)
    if (endDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const endDateNumber = coerceScalarToNumber(endDate, this.interpreter.dateHelper)
    if (endDateNumber instanceof CellError) {
      return endDateNumber
    }

    const startDate = this.evaluateAst(ast.args[1], formulaAddress)
    if (startDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const startDateNumber = coerceScalarToNumber(startDate, this.interpreter.dateHelper)
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
  public month(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.interpreter.dateHelper)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return this.interpreter.dateHelper.dateNumberToMonthNumber(dateNumber)
  }

  /**
   * Corresponds to YEAR(date)
   *
   * Returns the year specified by a given date
   *
   * @param ast
   * @param formulaAddress
   */
  public year(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.interpreter.dateHelper)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return this.interpreter.dateHelper.dateNumberToYearNumber(dateNumber)
  }

  /**
   * Corresponds to TEXT(number, format)
   *
   * Tries to convert number to specified date format.
   *
   * @param ast
   * @param formulaAddress
   */
  public text(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const dateArg = this.evaluateAst(ast.args[0], formulaAddress)
    const formatArg = this.evaluateAst(ast.args[1], formulaAddress)
    if (dateArg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const numberRepresentation = coerceScalarToNumber(dateArg, this.interpreter.dateHelper)
    if (numberRepresentation instanceof CellError) {
      return numberRepresentation
    }

    if (typeof formatArg !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    return format(numberRepresentation, formatArg, this.config, this.interpreter.dateHelper)
  }
}
