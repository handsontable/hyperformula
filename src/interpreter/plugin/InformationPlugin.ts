/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, EmptyValue, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ISERR': {
      method: 'iserr',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISERROR': {
      method: 'iserror',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISBLANK': {
      method: 'isblank',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISNA': {
      method: 'isna',
      parameters: [
        { argumentType: 'scalar'}
      ]
    },
    'ISNUMBER': {
      method: 'isnumber',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISLOGICAL': {
      method: 'islogical',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISREF': {
      method: 'isref',
      parameters: [
        { argumentType: 'scalar'}
      ]
    },
    'ISTEXT': {
      method: 'istext',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'ISNONTEXT': {
      method: 'isnontext',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
    },
    'COLUMNS': {
      method: 'columns',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    'ROWS': {
      method: 'rows',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    'INDEX': {
      method: 'index',
    },
    'NA': {
      method: 'na'
    }
  }

  /**
   * Corresponds to ISERR(value)
   *
   * Returns true if provided value is an error except #N/A!
   *
   * @param ast
   * @param formulaAddress
   */
  public iserr(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISERR'), (arg: InternalScalarValue) =>
      (arg instanceof CellError && arg.type !== ErrorType.NA)
    )
  }

  /**
   * Corresponds to ISERROR(value)
   *
   * Checks whether provided value is an error
   *
   * @param ast
   * @param formulaAddress
   */
  public iserror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISERROR'), (arg: InternalScalarValue) =>
      (arg instanceof CellError)
    )
  }

  /**
   * Corresponds to ISBLANK(value)
   *
   * Checks whether provided cell reference is empty
   *
   * @param ast
   * @param formulaAddress
   */
  public isblank(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISBLANK'), (arg: InternalScalarValue) =>
      (arg === EmptyValue)
    )
  }

  /**
   * Corresponds to ISNA(value)
   *
   * Returns true if provided value is #N/A! error
   *
   * @param ast
   * @param formulaAddress
   */
  public isna(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, InformationPlugin.implementedFunctions.ISNA.parameters, (arg: InternalScalarValue) =>
      (arg instanceof CellError && arg.type == ErrorType.NA)
    )
  }

  /**
   * Corresponds to ISNUMBER(value)
   *
   * Checks whether provided cell reference is a number
   *
   * @param ast
   * @param formulaAddress
   */
  public isnumber(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISNUMBER'), (arg: InternalScalarValue) =>
      (typeof arg === 'number')
    )
  }

  /**
   * Corresponds to ISLOGICAL(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public islogical(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISLOGICAL'), (arg: InternalScalarValue) =>
      (typeof arg === 'boolean')
    )
  }

  /**
   * Corresponds to ISREF(value)
   *
   * Returns true if provided value is #REF! error
   *
   * @param ast
   * @param formulaAddress
   */
  public isref(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithDefaults(ast.args, formulaAddress, InformationPlugin.implementedFunctions.ISREF.parameters, (arg: InternalScalarValue) =>
      (arg instanceof CellError && (arg.type == ErrorType.REF || arg.type == ErrorType.CYCLE))
    )
  }


  /**
   * Corresponds to ISTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public istext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISTEXT'), (arg: InternalScalarValue) =>
      (typeof arg === 'string')
    )
  }

  /**
   * Corresponds to ISNONTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param formulaAddress
   */
  public isnontext(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISNONTEXT'), (arg: InternalScalarValue) =>
      (typeof arg !== 'string')
    )
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
  public columns(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
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
  public rows(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const rangeAst = ast.args[0]
    if (rangeAst.type === AstNodeType.CELL_RANGE) {
      return (rangeAst.end.row - rangeAst.start.row + 1)
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  public index(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InterpreterValue {
    const rangeArg = ast.args[0]
    if (ast.args.length < 1 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
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

  /**
   * Corresponds to NA()
   *
   * Returns #N/A!
   *
   * @param _ast
   * @param _formulaAddress
   */
  public na(_ast: ProcedureAst, _formulaAddress: SimpleCellAddress): InternalCellValue {
    return new CellError(ErrorType.NA)
  }
}
