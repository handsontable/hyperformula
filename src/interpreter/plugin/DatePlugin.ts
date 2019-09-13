import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {dateNumberToMonthNumber, dateNumberToYearNumber, toDateNumber, dateNumberToMoment, momentToDateNumber} from '../../Date'
import {format} from '../../format/format'
import {parse} from '../../format/parser'
import {ProcedureAst} from '../../parser/Ast'
import {dateNumberRepresentation} from '../coerce'
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

    if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
      return new CellError(ErrorType.VALUE)
    }

    return toDateNumber(year, month, day)
  }

  public eomonth(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)
    if (dateNumber === null) {
      return new CellError(ErrorType.VALUE)
    }
    
    const numberOfMonthsToShift = this.evaluateAst(ast.args[1], formulaAddress)
    if (typeof numberOfMonthsToShift !== 'number') {
      return new CellError(ErrorType.VALUE)
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
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

    if (dateNumber !== null) {
      return dateNumberToMonthNumber(dateNumber)
    } else {
      return new CellError(ErrorType.VALUE)
    }
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
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

    if (dateNumber !== null) {
      return dateNumberToYearNumber(dateNumber)
    } else {
      return new CellError(ErrorType.VALUE)
    }
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

    const numberRepresentation = dateNumberRepresentation(dateArg, this.config.dateFormat)

    if (numberRepresentation === null || typeof formatArg !== 'string') {
      return new CellError(ErrorType.VALUE)
    }

    const expression = parse(formatArg)
    return format(expression, numberRepresentation)
  }
}
