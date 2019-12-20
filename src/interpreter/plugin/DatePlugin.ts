import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {
  dateNumberToDayOfMonth,
  dateNumberToMoment,
  dateNumberToMonthNumber,
  dateNumberToYearNumber, daysBetween,
  momentToDateNumber,
  toDateNumber,
} from '../../Date'
import {format} from '../../format/format'
import {parse} from '../../format/parser'
import {ProcedureAst} from '../../parser'
import {coerceScalarToNumber, dateNumberRepresentation} from '../coerce'
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

    const coercedYear = coerceScalarToNumber(year)
    const coercedMonth = coerceScalarToNumber(month)
    const coercedDay = coerceScalarToNumber(day)

    if (coercedYear instanceof CellError) {
      return coercedYear
    }

    if (coercedMonth instanceof CellError) {
      return coercedMonth
    }

    if (coercedDay instanceof CellError) {
      return coercedDay
    }

    return toDateNumber(coercedYear, coercedMonth, coercedDay)
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    const numberOfMonthsToShiftValue = this.evaluateAst(ast.args[1], formulaAddress)
    if (numberOfMonthsToShiftValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const numberOfMonthsToShift = coerceScalarToNumber(numberOfMonthsToShiftValue)
    if (numberOfMonthsToShift instanceof CellError) {
      return numberOfMonthsToShift
    }

    const dateMoment = dateNumberToMoment(dateNumber)
    if (numberOfMonthsToShift > 0) {
      dateMoment.add(numberOfMonthsToShift, 'months')
    } else {
      dateMoment.subtract(-numberOfMonthsToShift, 'months')
    }
    dateMoment.endOf('month').startOf('date')
    return momentToDateNumber(dateMoment)
  }

  public day(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToDayOfMonth(dateNumber)
  }

  public days(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const endDate = this.evaluateAst(ast.args[0], formulaAddress)
    if (endDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const endDateNumber = dateNumberRepresentation(endDate, this.config.dateFormat)
    if (endDateNumber instanceof CellError) {
      return endDateNumber
    }

    const startDate = this.evaluateAst(ast.args[1], formulaAddress)
    if (startDate instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const startDateNumber = dateNumberRepresentation(startDate, this.config.dateFormat)
    if (startDateNumber instanceof CellError) {
      return startDateNumber
    }

    return daysBetween(endDateNumber, startDateNumber)
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
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToMonthNumber(dateNumber)
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
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)
    if (dateNumber instanceof CellError) {
      return dateNumber
    }

    return dateNumberToYearNumber(dateNumber)
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

    const numberRepresentation = dateNumberRepresentation(dateArg, this.config.dateFormat)
    if (numberRepresentation instanceof CellError) {
      return numberRepresentation
    }

    if (typeof formatArg !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    const expression = parse(formatArg)
    return format(expression, numberRepresentation)
  }
}
