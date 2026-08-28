/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * The value of an INDEX index argument that selects every row or every column of the range instead
 * of a single one.
 */
const WHOLE_DIMENSION_INDEX = 0

/** Position of the `row_num` argument in the argument list of INDEX. */
const INDEX_ROW_ARGUMENT = 1

/** Position of the `column_num` argument in the argument list of INDEX. */
const INDEX_COLUMN_ARGUMENT = 2

/**
 * Reads the two index arguments the way Excel does, truncating both toward zero.
 *
 * When `column_num` is left out of the formula entirely, Excel requires the range to be a single row
 * or a single column, and reads the only index provided as the position along it: `=INDEX(A1:C1, 3)`
 * is `C1` and `=INDEX(A1:A3, 2)` is `A2`. Given a range with several rows and several columns there
 * is nothing for that index to mean, and Excel answers `#REF!` — which is what `undefined` requests
 * from the caller here.
 *
 * An argument left empty rather than left out, as in `=INDEX(A1:C1, 3, )`, is not the same thing: it
 * is a `column_num` of zero, so the result is the whole third row, and a single-row range has none.
 *
 * Either of the returned indices can be {@link WHOLE_DIMENSION_INDEX}, meaning that the result spans
 * the whole dimension.
 */
function resolveIndexArguments(rowArgument: number, columnArgument: number, columnArgumentIsOmitted: boolean, rangeHeight: number, rangeWidth: number): Maybe<{row: number, column: number}> {
  const row = Math.trunc(rowArgument)

  if (!columnArgumentIsOmitted) {
    return {row, column: Math.trunc(columnArgument)}
  }
  if (rangeHeight === 1) {
    return {row: 1, column: row}
  }
  if (rangeWidth === 1) {
    return {row, column: 1}
  }

  return undefined
}

/**
 * Returns the height a range is declared with, rather than the height the sheet currently uses.
 *
 * The two differ for an unbounded range, whose declared height is infinite while its used height
 * follows the data. Only the declared height may decide the single-row rule: keying that rule on the
 * used height would let `=INDEX(A:C, 2)` mean "cell B1" on a sheet holding one row of data and "the
 * whole second row" once a second row is filled in, and would also disagree with
 * {@link InformationPlugin#indexArraySize}, which has nothing but the declared size to work from.
 */
function declaredHeightOf(rangeValue: SimpleRangeValue): number {
  return rangeValue.range?.height() ?? rangeValue.height()
}

/**
 * Returns the width a range is declared with, rather than the width the sheet currently uses. See
 * {@link declaredHeightOf} for why the declared size is the one that may decide how an argument is
 * read.
 */
function declaredWidthOf(rangeValue: SimpleRangeValue): number {
  return rangeValue.range?.width() ?? rangeValue.width()
}

/**
 * Returns the value of an INDEX index argument that can be derived from the formula alone, or
 * `undefined` when it is known only once the argument is evaluated. An absent argument counts as
 * {@link WHOLE_DIMENSION_INDEX}, matching how such an argument is coerced at runtime. Truncation is
 * left to {@link resolveIndexArguments}, the single place that applies it.
 */
function staticIndexArgument(ast: ProcedureAst, argumentIndex: number): Maybe<number> {
  const argument = ast.args[argumentIndex]

  if (argument === undefined || argument.type === AstNodeType.EMPTY) {
    return WHOLE_DIMENSION_INDEX
  }

  return argument.type === AstNodeType.NUMBER ? argument.value : undefined
}

/**
 * Returns `true` if and only if the `column_num` argument is missing from the formula, as in
 * `=INDEX(A1:C3, 2)`. An argument that is present but empty, as in `=INDEX(A1:C3, 2, )`, is not
 * missing: it is a zero. See {@link resolveIndexArguments}.
 */
function columnArgumentIsOmitted(ast: ProcedureAst): boolean {
  return ast.args.length <= INDEX_COLUMN_ARGUMENT
}

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
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: WHOLE_DIMENSION_INDEX},
      ],
      // A vectorized call evaluates the function once per element and rejects an array result, which
      // an index of WHOLE_DIMENSION_INDEX produces. Array-output functions are never vectorized.
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
   * Corresponds to INDEX(range, row_num, column_num)
   *
   * Returns the value of a single cell of the range, or a whole row, a whole column or the whole
   * range when the corresponding index is {@link WHOLE_DIMENSION_INDEX}.
   *
   * A `column_num` that is omitted or empty is read as {@link WHOLE_DIMENSION_INDEX}, except for
   * single-row ranges, where the only index provided is read as the column number. Both conventions
   * come from Excel, where `=INDEX(A1:C3, 2)` returns the whole second row while
   * `=INDEX(A1:C1, 2)` returns cell `B1`.
   *
   * A result spanning more than one cell is an array, so the sheet has to reserve space for it
   * before the formula is evaluated. That space is reserved based on
   * {@link InformationPlugin#indexArraySize}, which can only tell the shape of the result for
   * indices written as literal numbers. When an index is computed by a subexpression, the result is
   * predicted to be a single cell: such a formula still passes whole rows and columns to an
   * enclosing function (for example `=SUM(INDEX(A1:C3, B1, 0))`), but it cannot spill into the
   * sheet on its own.
   *
   * @param ast
   * @param state
   */
  public index(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const columnIsOmitted = columnArgumentIsOmitted(ast)

    return this.runFunction(ast.args, state, this.metadata('INDEX'), (rangeValue: SimpleRangeValue, rowArg: number, columnArg: number): InterpreterValue => {
      if (rowArg < WHOLE_DIMENSION_INDEX || columnArg < WHOLE_DIMENSION_INDEX) {
        return new CellError(ErrorType.VALUE, ErrorMessage.Negative)
      }

      if (rangeValue.height() === 0 || rangeValue.width() === 0) {
        return new CellError(ErrorType.REF, ErrorMessage.EmptyRange)
      }

      const resolved = resolveIndexArguments(rowArg, columnArg, columnIsOmitted, declaredHeightOf(rangeValue), declaredWidthOf(rangeValue))

      if (resolved === undefined) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexBounds)
      }

      const {row, column} = resolved

      if (row > rangeValue.height() || column > rangeValue.width()) {
        return new CellError(ErrorType.REF, ErrorMessage.IndexBounds)
      }
      if (row !== WHOLE_DIMENSION_INDEX && column !== WHOLE_DIMENSION_INDEX) {
        return rangeValue.data[row - 1][column - 1]
      }

      const selectedRows = row === WHOLE_DIMENSION_INDEX ? rangeValue.data : [rangeValue.data[row - 1]]
      const selectedData: InternalScalarValue[][] = column === WHOLE_DIMENSION_INDEX
        ? selectedRows.map(rowData => rowData.slice())
        : selectedRows.map(rowData => [rowData[column - 1]])

      return selectedData.length === 1 && selectedData[0].length === 1
        ? selectedData[0][0]
        : SimpleRangeValue.onlyValues(selectedData)
    })
  }

  /**
   * Returns the size of the array returned by INDEX, or a scalar size when the shape of the result
   * cannot be derived from the formula alone. See {@link InformationPlugin#index}.
   *
   * The indices are resolved with the same {@link resolveIndexArguments} the evaluation uses, so
   * that the predicted shape cannot disagree with the shape of the value returned later.
   *
   * An index past the end of the range makes the formula fail, and a single cell is predicted for it
   * so that the error is reported once instead of filling the area an array result would have
   * occupied. A negative index needs no such case: it is always written as a negated literal, which
   * is not a literal number and so is not known here in the first place.
   *
   * An unbounded range (`A:C`, `1:2`) has an infinite dimension, and no area of that size can be
   * reserved in a sheet. A single cell is predicted for it too, which makes the formula report that
   * its result does not fit rather than silently spill only the part that does.
   *
   * @param ast
   * @param state
   */
  public indexArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const rowArgument = staticIndexArgument(ast, INDEX_ROW_ARGUMENT)
    const columnArgument = staticIndexArgument(ast, INDEX_COLUMN_ARGUMENT)

    if (rowArgument === undefined || columnArgument === undefined) {
      return ArraySize.scalar()
    }

    const rangeSize = this.arraySizeForAst(ast.args[0], state)
    const resolved = resolveIndexArguments(rowArgument, columnArgument, columnArgumentIsOmitted(ast), rangeSize.height, rangeSize.width)

    if (resolved === undefined) {
      return ArraySize.scalar()
    }

    const {row, column} = resolved

    if (row > rangeSize.height || column > rangeSize.width) {
      return ArraySize.scalar()
    }

    const width = column === WHOLE_DIMENSION_INDEX ? rangeSize.width : 1
    const height = row === WHOLE_DIMENSION_INDEX ? rangeSize.height : 1

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return ArraySize.scalar()
    }

    return new ArraySize(width, height)
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
