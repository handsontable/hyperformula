/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, EmptyValue, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    iserror: {
      translationKey: 'ISERROR',
    },
    isblank: {
      translationKey: 'ISBLANK',
    },
    isnumber: {
      translationKey: 'ISNUMBER',
    },
    islogical: {
      translationKey: 'ISLOGICAL',
    },
    istext: {
      translationKey: 'ISTEXT',
    },
    isnontext: {
      translationKey: 'ISNONTEXT',
    },
    columns: {
      translationKey: 'COLUMNS',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    rows: {
      translationKey: 'ROWS',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    index: {
      translationKey: 'INDEX',
    },
  }

  /**
   * Corresponds to ISERROR(value)
   *
   * Checks whether provided value is an error
   *
   * @param ast
   * @param formulaAddress
   */
  public iserror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = this.evaluateAst(ast.args[0], formulaAddress)
    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (arg instanceof CellError)

  }

  /**
   * Corresponds to ISBLANK(value)
   *
   * Checks whether provided cell reference is empty
   *
   * @param ast
   * @param formulaAddress
   */
  public isblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (value === EmptyValue)
  }

  /**
   * Corresponds to ISNUMBER(value)
   *
   * Checks whether provided cell reference is a number
   *
   * @param ast
   * @param formulaAddress
   */
  public isnumber(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (typeof value ===  'number')
  }

  /**
   * Corresponds to ISLOGICAL(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public islogical(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (typeof value ===  'boolean')
  }

  /**
   * Corresponds to ISTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public istext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (typeof value ===  'string')
  }

  /**
   * Corresponds to ISNONTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public isnontext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length != 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const arg = ast.args[0]
    const value = this.evaluateAst(arg, formulaAddress)
    if (value instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    return (typeof value !==  'string')
  }

  /**
   * Corresponds to COLUMNS(range)
   *
   * Returns number of columns in provided range of cells
   *
   * @param ast
   * @param formulaAddress
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public columns(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.type === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.col - rangeAst.start.col + 1)
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  /**
   * Corresponds to ROWS(range)
   *
   * Returns number of rows in provided range of cells
   *
   * @param ast
   * @param formulaAddress
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public rows(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.type === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.row - rangeAst.start.row + 1)
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  public index(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    const rangeArg = ast.args[0]
    if (ast.args.length < 1 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }
    if(ast.args.some((ast) => ast.type===AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }

    let width, height
    let range
    if (rangeArg.type === AstNodeType.CELL_RANGE) {
      range = AbsoluteCellRange.fromCellRange(rangeArg, formulaAddress)
      width = range.width()
      height = range.height()
    } else {
      width = 1
      height = 1
    }

    const rowArg = ast.args[1]
    const rowValue = this.evaluateAst(rowArg, formulaAddress)
    if (typeof rowValue !== 'number' || rowValue < 0 || rowValue > height) {
      return new CellError(ErrorType.NUM)
    }

    const columnArg = ast.args[2]
    const columnValue = this.evaluateAst(columnArg, formulaAddress)
    if (typeof columnValue !== 'number' || columnValue < 0 || columnValue > width) {
      return new CellError(ErrorType.NUM)
    }

    if (columnValue === 0 || rowValue === 0 || range === undefined) {
      throw Error('Not implemented yet')
    }

    const address = range.getAddress(columnValue - 1, rowValue - 1)
    return this.dependencyGraph.getCellValue(address)
  }
}
