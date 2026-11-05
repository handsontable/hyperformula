/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaVertex'
import {ErrorMessage} from '../../error-message'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

const TYPE_CODE_NUMBER = 1
const TYPE_CODE_TEXT = 2
const TYPE_CODE_BOOLEAN = 4
const TYPE_CODE_ERROR = 16
const TYPE_CODE_ARRAY = 64

/**
 * Codes returned by ERROR.TYPE. #NULL! (code 1) has no counterpart in HyperFormula. `#CYCLE!`, `#ERROR!` and `#LIC!`,
 * which are HyperFormula's own errors, have no code and give `#N/A`.
 */
const ERROR_TYPE_CODES: Partial<Record<ErrorType, number>> = {
  [ErrorType.DIV_BY_ZERO]: 2,
  [ErrorType.VALUE]: 3,
  [ErrorType.REF]: 4,
  [ErrorType.NAME]: 5,
  [ErrorType.NUM]: 6,
  [ErrorType.NA]: 7,
  [ErrorType.SPILL]: 9,
}

/**
 * Functions that declare `sizeOfResultArrayMethod` but return the kind of their only argument: an array stays an
 * array, while a single cell or a scalar stays a value.
 */
const FUNCTIONS_KEEPING_ARGUMENT_KIND = new Set(['ARRAYFORMULA', 'TRANSPOSE'])

/**
 * Functions that declare `sizeOfResultArrayMethod` but return a plain value or a reference when they find a single cell.
 */
const FUNCTIONS_NOT_ALWAYS_RETURNING_ARRAYS = new Set(['XLOOKUP'])

/**
 * Returns the expression inside any number of enclosing parentheses.
 *
 * @param {Ast} ast - the expression, possibly in parentheses
 */
function withoutParentheses(ast: Ast): Ast {
  while (ast.type === AstNodeType.PARENTHESIS) {
    ast = ast.expression
  }
  return ast
}

/**
 * Returns the TYPE code of a single (non-array) value.
 *
 * @param value
 */
function valueTypeCode(value: InterpreterValue): number {
  if (value instanceof CellError) {
    return TYPE_CODE_ERROR
  }
  if (typeof value === 'string') {
    return TYPE_CODE_TEXT
  }
  if (typeof value === 'boolean') {
    return TYPE_CODE_BOOLEAN
  }
  return TYPE_CODE_NUMBER
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
    'ERROR.TYPE': {
      method: 'errortype',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ]
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
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1},
      ]
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
    },
    'TYPE': {
      method: 'type',
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
      vectorizationForbidden: true,
      enableArrayArithmeticForArguments: true,
    }
  }

  /**
   * Corresponds to ERROR.TYPE(value)
   *
   * Returns the number of an error type (2-7 and 9), or #N/A when the value is not an error or the error has no code
   *
   * @param ast
   * @param state
   */
  public errortype(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ERROR.TYPE'), (arg: InternalScalarValue) => {
      if (!(arg instanceof CellError)) {
        return new CellError(ErrorType.NA)
      }
      return ERROR_TYPE_CODES[arg.type] ?? new CellError(ErrorType.NA)
    })
  }

  /**
   * Corresponds to TYPE(value)
   *
   * Returns the type of a value: 1 for numbers and empty cells, 2 for text, 4 for booleans, 16 for errors
   * and 64 for arrays of any size and multi-cell ranges. Errors are classified, not propagated.
   *
   * @param ast
   * @param state
   */
  public type(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (withoutParentheses(ast.args[0]).type === AstNodeType.ARRAY) {
      // An array constant is an array whatever it holds, a single error included.
      return TYPE_CODE_ARRAY
    }
    const value = this.evaluateAst(ast.args[0], state)
    if (value instanceof SimpleRangeValue) {
      return TYPE_CODE_ARRAY
    }
    if (!(value instanceof CellError) && (this.isRowOrColumnOfSeveralRowsOrColumns(ast.args[0], state) || this.isArrayExpression(ast.args[0]))) {
      return TYPE_CODE_ARRAY
    }
    return valueTypeCode(value)
  }

  /**
   * Whether the expression gives an array even when the array holds a single value. The interpreter turns
   * a one-by-one array into its only value before TYPE receives it, so `{1}` and `SEQUENCE(1)` arrive as the
   * number 1, and TYPE tells them apart from a plain 1 by the formula: an array constant, or a call to a function
   * that the registry declares with `sizeOfResultArrayMethod`.
   *
   * @param {Ast} ast - the argument of TYPE
   */
  private isArrayExpression(ast: Ast): boolean {
    ast = withoutParentheses(ast)
    if (ast.type === AstNodeType.ARRAY) {
      return true
    }
    if (ast.type !== AstNodeType.FUNCTION_CALL) {
      return false
    }
    if (FUNCTIONS_KEEPING_ARGUMENT_KIND.has(ast.procedureName)) {
      return ast.args.length === 1 && this.isArrayExpression(ast.args[0])
    }
    if (FUNCTIONS_NOT_ALWAYS_RETURNING_ARRAYS.has(ast.procedureName)) {
      return false
    }
    return this.interpreter.functionRegistry.getMetadata(ast.procedureName)?.sizeOfResultArrayMethod !== undefined
  }

  /**
   * ROW and COLUMN evaluate to a single number here, but TYPE reads ROW over more than one row, or COLUMN over more
   * than one column, as an array. It is called only after the call evaluated to a value that is not an error.
   *
   * @param ast
   * @param state
   */
  private isRowOrColumnOfSeveralRowsOrColumns(ast: Ast, state: InterpreterState): boolean {
    ast = withoutParentheses(ast)
    if (ast.type !== AstNodeType.FUNCTION_CALL || (ast.procedureName !== 'ROW' && ast.procedureName !== 'COLUMN') || ast.args.length !== 1) {
      return false
    }
    const arg = withoutParentheses(ast.args[0])
    if (arg.type !== AstNodeType.CELL_RANGE && arg.type !== AstNodeType.COLUMN_RANGE && arg.type !== AstNodeType.ROW_RANGE) {
      return false
    }
    const range = AbsoluteCellRange.fromAstOrUndef(arg, state.formulaAddress)
    if (range === undefined) {
      return false
    }
    return ast.procedureName === 'ROW' ? range.height() > 1 : range.width() > 1
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
   * Corresponds to INDEX
   *
   * Returns specific position in 2d array.
   *
   * @param ast
   * @param state
   */
  public index(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('INDEX'), (rangeValue: SimpleRangeValue, row: number, col: number) => {
      if (col < 1 || row < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (col > rangeValue.width() || row > rangeValue.height()) {
        return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
      }
      return rangeValue?.data?.[row - 1]?.[col - 1] ?? rangeValue?.data?.[0]?.[0] ?? new CellError(ErrorType.VALUE, ErrorMessage.CellRangeExpected)
    })
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
