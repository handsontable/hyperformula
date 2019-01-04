import {cellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {dateNumberToMonthNumber, dateNumberToYearNumber, dateNumebrToStringFormat, toDateNumber} from '../../Date'
import {Ast, ProcedureAst} from '../../parser/Ast'
import {dateNumberRepresentation} from '../coerce'
import {FunctionPlugin} from './FunctionPlugin'

export class DatePlugin extends FunctionPlugin {
  public static implementedFunctions = {
    date: {
      EN: 'DATE',
      PL: 'DATA',
    },
    month: {
      EN: 'MONTH',
      PL: 'MIESIAC',
    },
    year: {
      EN: 'YEAR',
      PL: 'ROK',
    },
    text: {
      EN: 'TEXT',
      PL: 'TEKST',
    },
  }

  public date(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 3) {
      return cellError(ErrorType.NA)
    }

    const year = this.evaluateAst(ast.args[0], formulaAddress)
    const month = this.evaluateAst(ast.args[1], formulaAddress)
    const day = this.evaluateAst(ast.args[2], formulaAddress)

    if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
      return cellError(ErrorType.VALUE)
    }

    return toDateNumber(year, month, day)
  }

  public month(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return cellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

    if (dateNumber !== null) {
      return dateNumberToMonthNumber(dateNumber)
    } else {
      return cellError(ErrorType.VALUE)
    }
  }

  public year(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return cellError(ErrorType.NA)
    }

    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

    if (dateNumber !== null) {
      return dateNumberToYearNumber(dateNumber)
    } else {
      return cellError(ErrorType.VALUE)
    }
  }

  public text(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return cellError(ErrorType.NA)
    }

    const dateArg = this.evaluateAst(ast.args[0], formulaAddress)
    const formatArg = this.evaluateAst(ast.args[1], formulaAddress)

    const dateNumber = dateNumberRepresentation(dateArg, this.config.dateFormat)

    if (dateNumber !== null && typeof formatArg === 'string') {
      return dateNumebrToStringFormat(dateNumber, formatArg)
    } else {
      return cellError(ErrorType.VALUE)
    }
  }
}
