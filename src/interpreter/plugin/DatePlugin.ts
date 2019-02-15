// import {cellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
// import {dateNumberToMonthNumber, dateNumberToYearNumber, toDateNumber} from '../../Date'
// import {format} from '../../format/format'
// import {parse} from '../../format/parser'
// import {ProcedureAst} from '../../parser/Ast'
// import {dateNumberRepresentation} from '../coerce'
// import {FunctionPlugin} from './FunctionPlugin'

// /**
//  * Interpreter plugin containing date-specific functions
//  */
// export class DatePlugin extends FunctionPlugin {
//   public static implementedFunctions = {
//     date: {
//       EN: 'DATE',
//       PL: 'DATA',
//     },
//     month: {
//       EN: 'MONTH',
//       PL: 'MIESIAC',
//     },
//     year: {
//       EN: 'YEAR',
//       PL: 'ROK',
//     },
//     text: {
//       EN: 'TEXT',
//       PL: 'TEKST',
//     },
//   }

//   /**
//    * Corresponds to DATE(year, month, day)
//    *
//    * Converts a provided year, month and day into date
//    *
//    * @param ast
//    * @param formulaAddress
//    */
//   public date(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
//     if (ast.args.length !== 3) {
//       return cellError(ErrorType.NA)
//     }

//     const year = this.evaluateAst(ast.args[0], formulaAddress)
//     const month = this.evaluateAst(ast.args[1], formulaAddress)
//     const day = this.evaluateAst(ast.args[2], formulaAddress)

//     if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
//       return cellError(ErrorType.VALUE)
//     }

//     return toDateNumber(year, month, day)
//   }

//   /**
//    * Corresponds to MONTH(date)
//    *
//    * Returns the month of the year specified by a given date
//    *
//    * @param ast
//    * @param formulaAddress
//    */
//   public month(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
//     if (ast.args.length !== 1) {
//       return cellError(ErrorType.NA)
//     }

//     const arg = this.evaluateAst(ast.args[0], formulaAddress)
//     const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

//     if (dateNumber !== null) {
//       return dateNumberToMonthNumber(dateNumber)
//     } else {
//       return cellError(ErrorType.VALUE)
//     }
//   }

//   /**
//    * Corresponds to YEAR(date)
//    *
//    * Returns the year specified by a given date
//    *
//    * @param ast
//    * @param formulaAddress
//    */
//   public year(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
//     if (ast.args.length !== 1) {
//       return cellError(ErrorType.NA)
//     }

//     const arg = this.evaluateAst(ast.args[0], formulaAddress)
//     const dateNumber = dateNumberRepresentation(arg, this.config.dateFormat)

//     if (dateNumber !== null) {
//       return dateNumberToYearNumber(dateNumber)
//     } else {
//       return cellError(ErrorType.VALUE)
//     }
//   }

//   /**
//    * Corresponds to TEXT(number, format)
//    *
//    * Tries to convert number to specified date format.
//    *
//    * @param ast
//    * @param formulaAddress
//    */
//   public text(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
//     if (ast.args.length !== 2) {
//       return cellError(ErrorType.NA)
//     }

//     const dateArg = this.evaluateAst(ast.args[0], formulaAddress)
//     const formatArg = this.evaluateAst(ast.args[1], formulaAddress)

//     const numberRepresentation = dateNumberRepresentation(dateArg, this.config.dateFormat)

//     if (numberRepresentation === null || typeof formatArg !== 'string') {
//       return cellError(ErrorType.VALUE)
//     }

//     const expression = parse(formatArg)
//     return format(expression, numberRepresentation)
//   }
// }
