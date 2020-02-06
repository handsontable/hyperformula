import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {
  dateNumberToDayNumber,
  dateNumberToMonthNumber,
  dateNumberToYearNumber,
  endOfMonth,
  isValidDate,
  numberToDate,
  offsetMonth,
  dateToNumber,
} from '../../Date'
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

    const coercedYear = coerceScalarToNumber(year, this.config)
    const coercedMonth = coerceScalarToNumber(month, this.config)
    const coercedDay = coerceScalarToNumber(day, this.config)

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
    if(m>12){
      y += Math.floor((m-1) / 12)
      m = (m-1)%12 + 1
    }
    const date = {year: y, month: m, day: 1}

    return (d>=1 && isValidDate(date, this.config)) ? dateToNumber(date, this.config)+(d-1) : new CellError(ErrorType.VALUE)
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.config)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    const numberOfMonthsToShiftValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (numberOfMonthsToShiftValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const numberOfMonthsToShift = coerceScalarToNumber(numberOfMonthsToShiftValue, this.config)
    if (numberOfMonthsToShift instanceof CellError) {
      return numberOfMonthsToShift
    }

    const date = numberToDate(dateNumber, this.config)
    return dateToNumber(endOfMonth(offsetMonth(date, numberOfMonthsToShift)), this.config)
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = coerceScalarToNumber(arg, this.config)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToDayNumber(dateNumber, this.config)
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const endDate = this.evaluateAst(ast.args[0], formulaAddress)
    if (endDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const endDateNumber = coerceScalarToNumber(endDate, this.config)
    if (endDateNumber instanceof CellError) {
      return endDateNumber
    }

    const startDate = this.evaluateAst(ast.args[1], formulaAddress)
    if (startDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const startDateNumber = coerceScalarToNumber(startDate, this.config)
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
    const dateNumber = coerceScalarToNumber(arg, this.config)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToMonthNumber(dateNumber, this.config)
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
    const dateNumber = coerceScalarToNumber(arg, this.config)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToYearNumber(dateNumber, this.config)
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

    const numberRepresentation = coerceScalarToNumber(dateArg, this.config)
    if (numberRepresentation instanceof CellError) {
      return numberRepresentation
    }

    if (typeof formatArg !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    return format(numberRepresentation, formatArg, this.config)
  }
}
