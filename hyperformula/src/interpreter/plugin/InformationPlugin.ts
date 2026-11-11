/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType, SimpleCellAddress, simpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin implements FunctionPluginTypecheck<InformationPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'COLUMN': {
      method: 'column',
      parameters: [
        {argumentType: FunctionArgumentType.NOERROR, optionalArg: true}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'COLUMNS': {
      method: 'columns',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ISBINARY': {
      method: 'isbinary',
      parameters: [
        {argumentType: FunctionArgumentType.STRING}
      ]
    },
    'ISERR': {
      method: 'iserr',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISFORMULA': {
      method: 'isformula',
      parameters: [
        {argumentType: FunctionArgumentType.NOERROR}
      ],
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ISNA': {
      method: 'isna',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISREF': {
      method: 'isref',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ],
      vectorizationForbidden: true,
    },
    'ISERROR': {
      method: 'iserror',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISBLANK': {
      method: 'isblank',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISNUMBER': {
      method: 'isnumber',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISLOGICAL': {
      method: 'islogical',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISTEXT': {
      method: 'istext',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'ISNONTEXT': {
      method: 'isnontext',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
    },
    'INDEX': {
      method: 'index',
      sizeOfResultArrayMethod: 'indexArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, optionalArg: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1},
      ],
      vectorizationForbidden: true,
    },
    'NA': {
      method: 'na',
      parameters: [],
    },
    'ROW': {
      method: 'row',
      parameters: [
        {argumentType: FunctionArgumentType.NOERROR, optionalArg: true}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ROWS': {
      method: 'rows',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'SHEET': {
      method: 'sheet',
      parameters: [
        {argumentType: FunctionArgumentType.STRING, optionalArg: true}
      ],
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'SHEETS': {
      method: 'sheets',
      parameters: [
        {argumentType: FunctionArgumentType.STRING, optionalArg: true}
      ],
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    }
  }

  /**
   * Corresponds to ISBINARY(value)
   *
   * Returns true if provided value is a valid binary number
   *
   * @param ast
   * @param state
   */
  public isbinary(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISBINARY'), (arg: string) =>
      /^[01]{1,10}$/.test(arg)
    )
  }

  /**
   * Corresponds to ISERR(value)
   *
   * Returns true if provided value is an error except #N/A!
   *
   * @param ast
   * @param state
   */
  public iserr(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISERR'), (arg: InternalScalarValue) =>
      (arg instanceof CellError && arg.type !== ErrorType.NA)
    )
  }

  /**
   * Corresponds to ISERROR(value)
   *
   * Checks whether provided value is an error
   *
   * @param ast
   * @param state
   */
  public iserror(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISERROR'), (arg: InternalScalarValue) =>
      (arg instanceof CellError)
    )
  }

  /**
   * Corresponds to ISFORMULA(value)
   *
   * Checks whether referenced cell is a formula
   *
   * @param ast
   * @param state
   */
  public isformula(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('ISFORMULA'),
      () => new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber),
      (reference: SimpleCellAddress) => {
        const vertex = this.dependencyGraph.addressMapping.getCell(reference)
        return vertex instanceof FormulaVertex
      }
    )
  }

  /**
   * Corresponds to ISBLANK(value)
   *
   * Checks whether provided cell reference is empty
   *
   * @param ast
   * @param state
   */
  public isblank(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISBLANK'), (arg: InternalScalarValue) =>
      (arg === EmptyValue)
    )
  }

  /**
   * Corresponds to ISNA(value)
   *
   * Returns true if provided value is #N/A! error
   *
   * @param ast
   * @param state
   */
  public isna(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISNA'), (arg: InternalScalarValue) =>
      (arg instanceof CellError && arg.type == ErrorType.NA)
    )
  }

  /**
   * Corresponds to ISNUMBER(value)
   *
   * Checks whether provided cell reference is a number
   *
   * @param ast
   * @param state
   */
  public isnumber(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISNUMBER'), isExtendedNumber)
  }

  /**
   * Corresponds to ISLOGICAL(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param state
   */
  public islogical(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISLOGICAL'), (arg: InternalScalarValue) =>
      (typeof arg === 'boolean')
    )
  }

  /**
   * Corresponds to ISREF(value)
   *
   * Returns true if provided value is #REF! error
   *
   * @param ast
   * @param state
   */
  public isref(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISREF'), (arg: InternalScalarValue) =>
      (arg instanceof CellError && (arg.type == ErrorType.REF || arg.type == ErrorType.CYCLE))
    )
  }

  /**
   * Corresponds to ISTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param state
   */
  public istext(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISTEXT'), (arg: InternalScalarValue) =>
      (typeof arg === 'string')
    )
  }

  /**
   * Corresponds to ISNONTEXT(value)
   *
   * Checks whether provided cell reference is of logical type
   *
   * @param ast
   * @param state
   */
  public isnontext(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ISNONTEXT'), (arg: InternalScalarValue) =>
      !(typeof arg === 'string')
    )
  }

  /**
   * Corresponds to COLUMN(reference)
   *
   * Returns column number of a reference or a formula cell if reference not provided
   *
   * @param ast
   * @param state
   */
  public column(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('COLUMN'),
      () => state.formulaAddress.col + 1,
      (reference: SimpleCellAddress) => reference.col + 1
    )
  }

  /**
   * Corresponds to COLUMNS(range)
   *
   * Returns number of columns in provided range of cells
   *
   * @param ast
   * @param state
   */
  public columns(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (ast.args.some((astIt) => astIt.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg)
    }
    let argAst = ast.args[0]
    while (argAst.type === AstNodeType.PARENTHESIS) {
      argAst = argAst.expression
    }
    if (argAst.type === AstNodeType.CELL_RANGE || argAst.type === AstNodeType.COLUMN_RANGE) {
      return argAst.end.col - argAst.start.col + 1
    } else if (argAst.type === AstNodeType.CELL_REFERENCE) {
      return 1
    } else if (argAst.type === AstNodeType.ROW_RANGE) {
      return this.config.maxColumns
    } else {
      const val = this.evaluateAst(argAst, state)
      if (val instanceof SimpleRangeValue) {
        return val.width()
      } else if (val instanceof CellError) {
        return val
      } else {
        return 1
      }
    }
  }

  /**
   * Corresponds to ROW(reference)
   *
   * Returns row number of a reference or a formula cell if reference not provided
   *
   * @param ast
   * @param state
   */
  public row(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('ROW'),
      () => state.formulaAddress.row + 1,
      (reference: SimpleCellAddress) => reference.row + 1
    )
  }

  /**
   * Corresponds to ROWS(range)
   *
   * Returns number of rows in provided range of cells
   *
   * @param ast
   * @param state
   */
  public rows(ast: ProcedureAst, state: InterpreterState): InternalScalarValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (ast.args.some((astIt) => astIt.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg)
    }
    let argAst = ast.args[0]
    while (argAst.type === AstNodeType.PARENTHESIS) {
      argAst = argAst.expression
    }
    if (argAst.type === AstNodeType.CELL_RANGE || argAst.type === AstNodeType.ROW_RANGE) {
      return argAst.end.row - argAst.start.row + 1
    } else if (argAst.type === AstNodeType.CELL_REFERENCE) {
      return 1
    } else if (argAst.type === AstNodeType.COLUMN_RANGE) {
      return this.config.maxRows
    } else {
      const val = this.evaluateAst(argAst, state)
      if (val instanceof SimpleRangeValue) {
        return val.height()
      } else if (val instanceof CellError) {
        return val
      } else {
        return 1
      }
    }
  }

  /**
   * Corresponds to INDEX(array, row_num, [column_num], [area_num])
   *
   * Returns the cell at `row_num` and `column_num` of `array`. A `row_num` of 0 returns the whole column, a
   * `column_num` of 0 the whole row, and both 0 the whole of `array`; such results spill.
   *
   * @param {ProcedureAst} ast - The parsed function call AST node.
   * @param {InterpreterState} state - Current interpreter evaluation state.
   */
  public index(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INDEX'), (source: SimpleRangeValue, row: number, column: Maybe<number>, area: number) => {
      const range = source.range
      const height = range !== undefined && !Number.isFinite(range.height()) ? this.config.maxRows : source.height()
      const width = range !== undefined && !Number.isFinite(range.width()) ? this.config.maxColumns : source.width()

      const target = InformationPlugin.indexTarget(height, width, range !== undefined, row, column, area)
      if (target instanceof CellError) {
        return target
      }
      const [targetRow, targetColumn] = target

      if (range === undefined) {
        const rows = targetRow === 0 ? source.data : [source.data[targetRow - 1]]
        const result: InternalScalarValue[][] = targetColumn === 0 ? rows : rows.map(rowValues => [rowValues[targetColumn - 1]])
        return result.length === 1 && result[0].length === 1 ? result[0][0] : SimpleRangeValue.onlyValues(result)
      }

      const topLeftCorner = simpleCellAddress(
        range.sheet,
        range.start.col + Math.max(targetColumn - 1, 0),
        range.start.row + Math.max(targetRow - 1, 0),
      )
      const resultRange = AbsoluteCellRange.spanFrom(
        topLeftCorner,
        targetColumn === 0 ? range.width() : 1,
        targetRow === 0 ? range.height() : 1,
      )
      return resultRange.width() === 1 && resultRange.height() === 1
        ? this.dependencyGraph.getScalarValue(topLeftCorner)
        : SimpleRangeValue.onlyRange(resultRange, this.dependencyGraph)
    })
  }

  /**
   * Predicts the size of the INDEX result at parse time.
   *
   * The size is known only when `row_num`, `column_num` and `area_num` are number literals or empty. Otherwise
   * INDEX is sized as a single cell, so a computed 0 index cannot spill.
   *
   * @param {ProcedureAst} ast - The parsed function call AST node.
   * @param {InterpreterState} state - Current interpreter evaluation state.
   */
  public indexArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 4) {
      return ArraySize.scalar()
    }

    const row = InformationPlugin.literalIndex(ast.args[1])
    const column = ast.args.length > 2 ? InformationPlugin.literalIndex(ast.args[2]) : undefined
    const area = ast.args.length > 3 ? InformationPlugin.literalIndex(ast.args[3]) : 1
    if (row === undefined || area === undefined || (ast.args.length > 2 && column === undefined)) {
      return ArraySize.scalar()
    }

    const source = this.arraySizeForAst(ast.args[0], state)
    const height = Number.isFinite(source.height) ? source.height : this.config.maxRows
    const width = Number.isFinite(source.width) ? source.width : this.config.maxColumns
    const target = InformationPlugin.indexTarget(height, width, InformationPlugin.isReferenceSource(ast.args[0]), row, column, area)
    if (target instanceof CellError) {
      return ArraySize.scalar()
    }

    const [targetRow, targetColumn] = target
    const resultHeight = targetRow === 0 ? source.height : 1
    const resultWidth = targetColumn === 0 ? source.width : 1
    if (!Number.isFinite(resultHeight) || !Number.isFinite(resultWidth)) {
      return ArraySize.scalar()
    }
    return new ArraySize(resultWidth, resultHeight)
  }

  /**
   * Resolves the INDEX arguments against a source of the given size, following Microsoft Excel.
   *
   * Returns the 1-based row and column, where 0 stands for the whole column or row, or the error to return.
   * Without `column_num`, the index counts along a one-row or one-column source; for a two-dimensional source
   * it selects a row of an array and is an error for a reference.
   */
  private static indexTarget(height: number, width: number, isReference: boolean, row: number, column: Maybe<number>, area: number): CellError | [number, number] {
    const areaNumber = Math.trunc(area)
    if (areaNumber < 1) {
      return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
    }
    if (row < 0 || (column !== undefined && column < 0)) {
      return new CellError(ErrorType.VALUE, ErrorMessage.Negative)
    }
    if (areaNumber > 1) {
      return new CellError(ErrorType.REF, ErrorMessage.IndexBounds)
    }

    let targetRow = Math.trunc(row)
    let targetColumn: number
    if (column !== undefined) {
      targetColumn = Math.trunc(column)
    } else if (height === 1) {
      targetColumn = targetRow
      targetRow = 1
    } else if (width === 1) {
      targetColumn = 1
    } else if (isReference) {
      return new CellError(ErrorType.REF, ErrorMessage.IndexBounds)
    } else {
      targetColumn = 0
    }

    if (targetRow > height || targetColumn > width) {
      return new CellError(ErrorType.REF, ErrorMessage.IndexBounds)
    }
    return [targetRow, targetColumn]
  }

  /**
   * Tells whether an INDEX source evaluates to a reference: a range, a cell, or the result of INDEX on one.
   * Matches `index`, which treats a source that carries a range as a reference.
   */
  private static isReferenceSource(ast: Ast): boolean {
    switch (ast.type) {
      case AstNodeType.CELL_RANGE:
      case AstNodeType.COLUMN_RANGE:
      case AstNodeType.ROW_RANGE:
      case AstNodeType.CELL_REFERENCE:
        return true
      case AstNodeType.PARENTHESIS:
        return InformationPlugin.isReferenceSource(ast.expression)
      case AstNodeType.FUNCTION_CALL:
        return ast.procedureName === 'INDEX' && ast.args.length > 0 && InformationPlugin.isReferenceSource(ast.args[0])
      default:
        return false
    }
  }

  /**
   * Returns the value of an INDEX argument known at parse time: a number literal, or 0 for an empty argument.
   */
  private static literalIndex(ast: Ast): Maybe<number> {
    if (ast.type === AstNodeType.NUMBER) {
      return ast.value
    }
    if (ast.type === AstNodeType.EMPTY) {
      return 0
    }
    return undefined
  }

  /**
   * Corresponds to NA()
   *
   * Returns #N/A!
   *
   * @param _ast
   * @param _state
   */
  public na(_ast: ProcedureAst, _state: InterpreterState): CellError {
    return new CellError(ErrorType.NA)
  }

  /**
   * Corresponds to SHEET(value)
   *
   * Returns sheet number of a given value or a formula sheet number if no argument is provided
   *
   * @param ast
   * @param state
   */
  public sheet(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('SHEET'),
      () => state.formulaAddress.sheet + 1,
      (reference: SimpleCellAddress) => reference.sheet + 1,
      (value: string) => {
        const sheetNumber = this.dependencyGraph.sheetMapping.getSheetId(value)
        if (sheetNumber !== undefined) {
          return sheetNumber + 1
        } else {
          return new CellError(ErrorType.NA, ErrorMessage.SheetRef)
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
   * @param state
   */
  public sheets(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('SHEETS'),
      () => this.dependencyGraph.sheetMapping.numberOfSheets(), // return number of sheets if no argument
      () => 1, // return 1 for valid reference
      () => new CellError(ErrorType.VALUE, ErrorMessage.CellRefExpected) // error otherwise
    )
  }
}
