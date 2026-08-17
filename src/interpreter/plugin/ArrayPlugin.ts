/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/** A CHOOSECOLS index classified without evaluating a formula expression. */
type ChooseColsLiteralIndex =
  | {kind: 'value', value: number}
  | {kind: 'invalid'}
  | {kind: 'unresolved'}

export class ArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<ArrayPlugin> {
  /**
   * Classifies an index literal for static CHOOSECOLS result-size prediction.
   *
   * @param {Ast} argument - The column-index argument to inspect without evaluating formulas.
   * @returns {ChooseColsLiteralIndex} A coerced literal value, an invalid marker, or an unresolved marker.
   */
  private parseChooseColsLiteralIndex(argument: Ast): ChooseColsLiteralIndex {
    if (argument.type === AstNodeType.NUMBER) {
      return {kind: 'value', value: Math.trunc(argument.value)}
    }

    if (argument.type === AstNodeType.STRING) {
      const coercedValue = this.arithmeticHelper.coerceToMaybeNumber(argument.value)
      if (coercedValue === undefined) {
        return {kind: 'invalid'}
      }
      return {kind: 'value', value: Math.trunc(getRawValue(coercedValue))}
    }

    if (argument.type === AstNodeType.PLUS_UNARY_OP && argument.value.type === AstNodeType.NUMBER) {
      return {kind: 'value', value: Math.trunc(argument.value.value)}
    }

    if (argument.type === AstNodeType.MINUS_UNARY_OP && argument.value.type === AstNodeType.NUMBER) {
      return {kind: 'value', value: Math.trunc(-argument.value.value)}
    }

    if (argument.type === AstNodeType.PARENTHESIS) {
      return this.parseChooseColsLiteralIndex(argument.expression)
    }

    return {kind: 'unresolved'}
  }

  public static implementedFunctions: ImplementedFunctions = {
    'ARRAYFORMULA': {
      method: 'arrayformula',
      sizeOfResultArrayMethod: 'arrayformulaArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.ANY}
      ],
    },
    'ARRAY_CONSTRAIN': {
      method: 'arrayconstrain',
      sizeOfResultArrayMethod: 'arrayconstrainArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
      ],
      vectorizationForbidden: true,
    },
    'FILTER': {
      method: 'filter',
      sizeOfResultArrayMethod: 'filterArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
    'CHOOSECOLS': {
      method: 'choosecols',
      sizeOfResultArrayMethod: 'choosecolsArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.NUMBER},
      ],
      repeatLastArgs: 1,
      vectorizationForbidden: true,
    },
    'VSTACK': {
      method: 'vstack',
      sizeOfResultArrayMethod: 'vstackArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
    'HSTACK': {
      method: 'hstack',
      sizeOfResultArrayMethod: 'hstackArraySize',
      enableArrayArithmeticForArguments: true,
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      repeatLastArgs: 1,
    },
  }

  public arrayformula(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAYFORMULA'), (value) => value)
  }

  public arrayformulaArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAYFORMULA')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    return subChecks[0]
  }

  public arrayconstrain(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARRAY_CONSTRAIN'), (range: SimpleRangeValue, numRows: number, numCols: number) => {
      numRows = Math.min(numRows, range.height())
      numCols = Math.min(numCols, range.width())
      const data: InternalScalarValue[][] = range.data
      const ret: InternalScalarValue[][] = []
      for (let i = 0; i < numRows; i++) {
        ret.push(data[i].slice(0, numCols))
      }
      return SimpleRangeValue.onlyValues(ret)
    })
  }

  public arrayconstrainArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('ARRAY_CONSTRAIN')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    let {height, width} = subChecks[0]
    if (ast.args[1].type === AstNodeType.NUMBER) {
      height = Math.min(height, ast.args[1].value)
    }
    if (ast.args[2].type === AstNodeType.NUMBER) {
      width = Math.min(width, ast.args[2].value)
    }
    if (height < 1 || width < 1 || !Number.isInteger(height) || !Number.isInteger(width)) {
      return ArraySize.error()
    }
    return new ArraySize(width, height)
  }

  public filter(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FILTER'), (rangeVals: SimpleRangeValue, ...rangeFilters: SimpleRangeValue[]) => {
      for (const filter of rangeFilters) {
        if (rangeVals.width() !== filter.width() || rangeVals.height() !== filter.height()) {
          return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
        }
      }

      if (rangeVals.width() > 1 && rangeVals.height() > 1) {
        return new CellError(ErrorType.NA, ErrorMessage.WrongDimension)
      }

      const vals = rangeVals.data
      const ret = []
      for (let i = 0; i < rangeVals.height(); i++) {
        const row = []
        for (let j = 0; j < rangeVals.width(); j++) {
          let ok = true
          for (const filter of rangeFilters) {
            const val = coerceScalarToBoolean(filter.data[i][j])
            if (val !== true) {
              ok = false
              break
            }
          }
          if (ok) {
            row.push(vals[i][j])
          }
        }
        if (row.length > 0) {
          ret.push(row)
        }
      }
      if (ret.length > 0) {
        return SimpleRangeValue.onlyValues(ret)
      } else {
        return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
      }
    })
  }

  public filterArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length <= 1) {
      return ArraySize.error()
    }

    const metadata = this.metadata('FILTER')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    const width = Math.max(...(subChecks).map(val => val.width))
    const height = Math.max(...(subChecks).map(val => val.height))
    return new ArraySize(width, height)
  }

  /**
   * Corresponds to CHOOSECOLS(array, col_num1, [col_num2], ...).
   *
   * Returns the requested source columns in argument order. Positive indexes
   * count from the left, negative indexes count from the right, and duplicate
   * indexes duplicate their columns in the result.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {InterpreterValue} The selected source columns or a spreadsheet error.
   */
  public choosecols(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CHOOSECOLS'),
      (range: SimpleRangeValue, ...columnNumbers: number[]) => {
        const sourceWidth = range.width()
        const sourceHeight = range.height()

        if (sourceHeight === 0 || sourceWidth === 0) {
          return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
        }

        const columnIndexes = columnNumbers.map(columnNumber => Math.trunc(columnNumber))

        if (columnIndexes.some(columnIndex =>
          !Number.isFinite(columnIndex) || columnIndex === 0 || Math.abs(columnIndex) > sourceWidth
        )) {
          return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
        }

        const zeroBasedColumnIndexes = columnIndexes.map(columnIndex =>
          columnIndex > 0 ? columnIndex - 1 : sourceWidth + columnIndex
        )

        const sourceRange = range.range
        const startsBelowFirstRow = sourceRange !== undefined
          && !Number.isFinite(sourceRange.height())
          && state.formulaAddress.row !== 0

        if (startsBelowFirstRow) {
          return new CellError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult)
        }

        if (sourceRange !== undefined) {
          const selectedColumns = zeroBasedColumnIndexes.map(columnIndex => {
            const columnRange = AbsoluteCellRange.spanFrom(
              sourceRange.getAddress(columnIndex, 0),
              1,
              sourceHeight,
            )
            return SimpleRangeValue.onlyRange(columnRange, this.dependencyGraph).data
          })
          const result = Array.from({length: sourceHeight}, (_, row) =>
            selectedColumns.map(column => column[row][0])
          )
          return SimpleRangeValue.onlyValues(result)
        }

        const result = range.data.map(row =>
          zeroBasedColumnIndexes.map(columnIndex => row[columnIndex])
        )
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /**
   * Predicts the CHOOSECOLS spill size from the source height and index count.
   *
   * Invalid literals are rejected before spill allocation. A whole-column
   * result is valid only in the first output row, then its source range
   * supplies the materialized spill height.
   *
   * @param {ProcedureAst} ast - The parsed function-call AST node.
   * @param {InterpreterState} state - The current interpreter evaluation state.
   * @returns {ArraySize} The predicted result dimensions or an invalid size.
   */
  public choosecolsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) {
      return ArraySize.error()
    }

    const metadata = this.metadata('CHOOSECOLS')
    const sourceSize = this.arraySizeForAst(
      ast.args[0],
      new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)),
    )

    const startsBelowFirstRow = !Number.isFinite(sourceSize.height) && state.formulaAddress.row !== 0
    const sourceRange = ast.args[0].type === AstNodeType.COLUMN_RANGE
      ? AbsoluteCellRange.fromAstOrUndef(ast.args[0], state.formulaAddress)
      : undefined
    const effectiveHeight = !Number.isFinite(sourceSize.height) && sourceRange !== undefined
      ? sourceRange.effectiveHeight(this.dependencyGraph)
      : sourceSize.height

    if (startsBelowFirstRow || effectiveHeight < 1) {
      return ArraySize.error()
    }

    for (const argument of ast.args.slice(1)) {
      const index = this.parseChooseColsLiteralIndex(argument)
      if (
        index.kind === 'invalid'
        || (index.kind === 'value' && (
          !Number.isFinite(index.value)
          || index.value === 0
          || Math.abs(index.value) > sourceSize.width
        ))
      ) {
        return ArraySize.error()
      }
    }

    return new ArraySize(ast.args.length - 1, effectiveHeight)
  }

  /**
   * Corresponds to VSTACK(array1, [array2], ...)
   *
   * Stacks the input arrays vertically, one on top of another, into a single array.
   * The result has as many rows as the inputs combined and as many columns as the
   * widest input. Cells of narrower inputs are padded on the right with the #N/A
   * error, matching the behaviour of Excel and Google Sheets.
   *
   * @param ast
   * @param state
   */
  public vstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VSTACK'), (...ranges: SimpleRangeValue[]) => {
      const width = Math.max(...ranges.map(range => range.width()))
      const result: InternalScalarValue[][] = []

      for (const range of ranges) {
        for (const row of range.data) {
          result.push(this.padRowToWidth(row, width))
        }
      }

      return SimpleRangeValue.onlyValues(result)
    })
  }

  /**
   * Calculates the spilled array size of VSTACK: the width is the widest input
   * and the height is the sum of all input heights.
   *
   * @param ast
   * @param state
   */
  public vstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) {
      return ArraySize.error()
    }

    const subChecks = this.stackSubChecks(ast, state, 'VSTACK')
    const width = Math.max(...subChecks.map(size => size.width))
    const height = subChecks.reduce((total, size) => total + size.height, 0)
    return new ArraySize(width, height)
  }

  /**
   * Corresponds to HSTACK(array1, [array2], ...)
   *
   * Stacks the input arrays horizontally, side by side, into a single array.
   * The result has as many columns as the inputs combined and as many rows as the
   * tallest input. Cells of shorter inputs are padded at the bottom with the #N/A
   * error, matching the behaviour of Excel and Google Sheets.
   *
   * @param ast
   * @param state
   */
  public hstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HSTACK'), (...ranges: SimpleRangeValue[]) => {
      const height = Math.max(...ranges.map(range => range.height()))
      const result: InternalScalarValue[][] = [...Array(height).keys()].map(() => [])

      for (const range of ranges) {
        const data = range.data
        const width = range.width()
        for (let row = 0; row < height; row++) {
          const sourceRow = row < data.length ? data[row] : undefined
          for (let col = 0; col < width; col++) {
            // Pad both missing rows (sourceRow === undefined) and short rows
            // (col beyond the row's length) with #N/A, exactly as VSTACK does.
            result[row].push(sourceRow !== undefined && col < sourceRow.length
              ? sourceRow[col]
              : new CellError(ErrorType.NA, ErrorMessage.ValueNotFound))
          }
        }
      }

      return SimpleRangeValue.onlyValues(result)
    })
  }

  /**
   * Calculates the spilled array size of HSTACK: the width is the sum of all
   * input widths and the height is the tallest input.
   *
   * @param ast
   * @param state
   */
  public hstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) {
      return ArraySize.error()
    }

    const subChecks = this.stackSubChecks(ast, state, 'HSTACK')
    const width = subChecks.reduce((total, size) => total + size.width, 0)
    const height = Math.max(...subChecks.map(size => size.height))
    return new ArraySize(width, height)
  }

  /**
   * Resolves the array size of every argument of a stacking function, enabling
   * array arithmetic for the arguments when the function's metadata requests it.
   *
   * @param ast
   * @param state
   * @param functionName - the stacking function whose metadata drives the array-arithmetic flag
   */
  private stackSubChecks(ast: ProcedureAst, state: InterpreterState, functionName: 'VSTACK' | 'HSTACK'): ArraySize[] {
    const metadata = this.metadata(functionName)
    return ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
  }

  /**
   * Returns a copy of the given row resized to exactly `width` cells: longer
   * rows are truncated and shorter rows are padded on the right with #N/A. Used
   * by VSTACK to align every stacked row to the widest input.
   *
   * @param row - the source row to resize
   * @param width - the target number of cells
   */
  private padRowToWidth(row: InternalScalarValue[], width: number): InternalScalarValue[] {
    if (row.length >= width) {
      return row.slice(0, width)
    }
    const padded = row.slice()
    while (padded.length < width) {
      padded.push(new CellError(ErrorType.NA, ErrorMessage.ValueNotFound))
    }
    return padded
  }
}
