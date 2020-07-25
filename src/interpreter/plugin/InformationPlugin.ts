/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, EmptyValue, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionArgumentsDefinition, FunctionPlugin} from './FunctionPlugin'
import {Maybe} from '../../Maybe'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'COLUMNS': {
      method: 'columns',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    'ISBINARY': {
      method: 'isbinary',
      parameters: {
        list: [
          {argumentType: 'string'}
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
    'ISNA': {
      method: 'isna',
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
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
      parameters: {
        list: [
          {argumentType: 'scalar'}
        ]
      }
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
    'INDEX': {
      method: 'index',
    },
    'NA': {
      method: 'na'
    },
    'ROWS': {
      method: 'rows',
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
    },
    'SHEET': {
      method: 'sheet',
      parameters: {
        list: [
          {argumentType: 'noerror'}
        ]
      },
      doesNotNeedArgumentsToBeComputed: true
    },
    'SHEETS': {
      method: 'sheets',
      parameters: {
        list: [
          {argumentType: 'noerror'}
        ]
      },
      doesNotNeedArgumentsToBeComputed: true
    }
  }

  /**
   * Corresponds to ISBINARY(value)
   *
   * Returns true if provided value is a valid binary number
   *
   * @param ast
   * @param formulaAddress
   */
  public isbinary(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISBINARY'), (arg: string) =>
      /^[01]{1,10}$/.test(arg)
    )
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISNA'), (arg: InternalScalarValue) =>
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
    return this.runFunction(ast.args, formulaAddress, this.parameters('ISREF'), (arg: InternalScalarValue) =>
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
  public na(_ast: ProcedureAst, _formulaAddress: SimpleCellAddress): CellError {
    return new CellError(ErrorType.NA)
  }

  /**
   * Corresponds to SHEET(value)
   *
   * Returns sheet number of a given value or a formula sheet number if no argument is provided
   *
   * @param ast
   * @param formulaAddress
   * */
  public sheet(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithReferenceArgument(ast.args, formulaAddress, { list: [{argumentType: 'string'}] },
      () => formulaAddress.sheet + 1,
      (reference: SimpleCellAddress) => reference.sheet + 1,
      (value: string) => {
        const sheetNumber = this.dependencyGraph.sheetMapping.get(value)
        if (sheetNumber !== undefined) {
          return sheetNumber + 1
        } else {
          return new CellError(ErrorType.NA)
        }
      }
    )
  }

  /**
   * Corresponds to SHEETS(value)
   *
   * Returns number of sheet of a given reference or number of all sheets in workbook when no argument is provided.
   * It returns always 1 for a valid reference as 3D references are not supported.
   *
   * @param ast
   * @param formulaAddress
   * */
  public sheets(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunctionWithReferenceArgument(ast.args, formulaAddress, { list: [{argumentType: 'string'}] },
      () => this.dependencyGraph.sheetMapping.numberOfSheets(), // return number of sheets if no argument
      () => 1, // return 1 for valid reference
      () => new CellError(ErrorType.VALUE) // error otherwise
    )
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    argumentDefinitions: FunctionArgumentsDefinition,
    noArgCallback: () => InternalScalarValue,
    referenceCallback: (reference: SimpleCellAddress) => InternalScalarValue,
    nonReferenceCallback: (...arg: any) => InternalScalarValue
  ) => {
    if (args.length === 0) {
      return noArgCallback()
    } else if (args.length > 1) {
      return new CellError(ErrorType.NA)
    }
    const arg = args[0]

    let cellReference: Maybe<SimpleCellAddress>

    if (arg.type === AstNodeType.CELL_REFERENCE) {
      cellReference = arg.reference.toSimpleCellAddress(formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF)
      }
    }

    if (cellReference !== undefined) {
      return referenceCallback(cellReference)
    }

    return this.runFunction(args, formulaAddress, argumentDefinitions, nonReferenceCallback)
  }
}
