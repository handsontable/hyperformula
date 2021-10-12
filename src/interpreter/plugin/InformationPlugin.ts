/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {FormulaVertex} from '../../DependencyGraph/FormulaCellVertex'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

/**
 * Interpreter plugin containing information functions
 */
export class InformationPlugin extends FunctionPlugin implements FunctionPluginTypecheck<InformationPlugin> {
  public static implementedFunctions = {
    'COLUMN': {
      method: 'column',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, optional: true}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'COLUMNS': {
      method: 'columns',
      parameters: [
        {argumentType: ArgumentTypes.RANGE}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ISBINARY': {
      method: 'isbinary',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'ISERR': {
      method: 'iserr',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISFORMULA': {
      method: 'isformula',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR}
      ],
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ISNA': {
      method: 'isna',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISREF': {
      method: 'isref',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ],
      vectorizationForbidden: true,
    },
    'ISERROR': {
      method: 'iserror',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISBLANK': {
      method: 'isblank',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISNUMBER': {
      method: 'isnumber',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISLOGICAL': {
      method: 'islogical',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISTEXT': {
      method: 'istext',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'ISNONTEXT': {
      method: 'isnontext',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'INDEX': {
      method: 'index',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'NA': {
      method: 'na',
      parameters: [],
    },
    'ROW': {
      method: 'row',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, optional: true}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'ROWS': {
      method: 'rows',
      parameters: [
        {argumentType: ArgumentTypes.RANGE}
      ],
      isDependentOnSheetStructureChange: true,
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'SHEET': {
      method: 'sheet',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ],
      doesNotNeedArgumentsToBeComputed: true,
      vectorizationForbidden: true,
    },
    'SHEETS': {
      method: 'sheets',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
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
   * @param _state
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
   * @param _state
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
   * Corresponds to INDEX(range;)
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
   * */
  public sheet(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('SHEET'),
      () => state.formulaAddress.sheet + 1,
      (reference: SimpleCellAddress) => reference.sheet + 1,
      (value: string) => {
        const sheetNumber = this.dependencyGraph.sheetMapping.get(value)
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
   * */
  public sheets(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunctionWithReferenceArgument(ast.args, state, this.metadata('SHEETS'),
      () => this.dependencyGraph.sheetMapping.numberOfSheets(), // return number of sheets if no argument
      () => 1, // return 1 for valid reference
      () => new CellError(ErrorType.VALUE, ErrorMessage.CellRefExpected) // error otherwise
    )
  }
}
