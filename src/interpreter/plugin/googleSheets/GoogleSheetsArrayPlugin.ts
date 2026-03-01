/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import { ArraySize } from '../../../ArraySize'
import { CellError, ErrorType } from '../../../Cell'
import { ErrorMessage } from '../../../error-message'
import { Ast, AstNodeType, ProcedureAst } from '../../../parser'
import { InterpreterState } from '../../InterpreterState'
import { EmptyValue, getRawValue, InternalScalarValue, InterpreterValue, isExtendedNumber, RichNumber } from '../../InterpreterValue'
import { SimpleRangeValue } from '../../../SimpleRangeValue'
import { FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions } from '../FunctionPlugin'

/**
 * Google Sheets-compatible array and matrix functions.
 *
 * Implements SORT, UNIQUE, FLATTEN, CHOOSECOLS, CHOOSEROWS, HSTACK, VSTACK,
 * WRAPCOLS, WRAPROWS, TOCOL, TOROW, SEQUENCE, FREQUENCY, MDETERM, MINVERSE,
 * MUNIT, GROWTH, TREND, LINEST, LOGEST.
 */
export class GoogleSheetsArrayPlugin extends FunctionPlugin implements FunctionPluginTypecheck<GoogleSheetsArrayPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SORT': {
      method: 'sort',
      sizeOfResultArrayMethod: 'sortArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER, defaultValue: 1 },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
      ],
      repeatLastArgs: 2,
    },
    'UNIQUE': {
      method: 'unique',
      sizeOfResultArrayMethod: 'uniqueArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
      ],
    },
    'FLATTEN': {
      method: 'flatten',
      sizeOfResultArrayMethod: 'flattenArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
      ],
      repeatLastArgs: 1,
    },
    'CHOOSECOLS': {
      method: 'choosecols',
      sizeOfResultArrayMethod: 'choosecolsArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER },
      ],
      repeatLastArgs: 1,
    },
    'CHOOSEROWS': {
      method: 'chooserows',
      sizeOfResultArrayMethod: 'chooserowsArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER },
      ],
      repeatLastArgs: 1,
    },
    'HSTACK': {
      method: 'hstack',
      sizeOfResultArrayMethod: 'hstackArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE },
      ],
      repeatLastArgs: 1,
    },
    'VSTACK': {
      method: 'vstack',
      sizeOfResultArrayMethod: 'vstackArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE },
      ],
      repeatLastArgs: 1,
    },
    'WRAPCOLS': {
      method: 'wrapcols',
      sizeOfResultArrayMethod: 'wrapcolsArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER, minValue: 1 },
        { argumentType: FunctionArgumentType.SCALAR, optionalArg: true },
      ],
    },
    'WRAPROWS': {
      method: 'wraprows',
      sizeOfResultArrayMethod: 'wraprowsArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER, minValue: 1 },
        { argumentType: FunctionArgumentType.SCALAR, optionalArg: true },
      ],
    },
    'TOCOL': {
      method: 'tocol',
      sizeOfResultArrayMethod: 'tocolArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER, defaultValue: 0, minValue: 0, maxValue: 3 },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false },
      ],
    },
    'TOROW': {
      method: 'torow',
      sizeOfResultArrayMethod: 'torowArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.INTEGER, defaultValue: 0, minValue: 0, maxValue: 3 },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false },
      ],
    },
    'SEQUENCE': {
      method: 'sequence',
      sizeOfResultArrayMethod: 'sequenceArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.INTEGER, minValue: 1 },
        { argumentType: FunctionArgumentType.INTEGER, defaultValue: 1, minValue: 1 },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ],
    },
    'FREQUENCY': {
      method: 'frequency',
      sizeOfResultArrayMethod: 'frequencyArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE },
      ],
    },
    'MDETERM': {
      method: 'mdeterm',
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
      ],
    },
    'MINVERSE': {
      method: 'minverse',
      sizeOfResultArrayMethod: 'minverseArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
      ],
    },
    'MUNIT': {
      method: 'munit',
      sizeOfResultArrayMethod: 'munitArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.INTEGER, minValue: 1 },
      ],
    },
    'GROWTH': {
      method: 'growth',
      sizeOfResultArrayMethod: 'growthArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
      ],
    },
    'TREND': {
      method: 'trend',
      sizeOfResultArrayMethod: 'trendArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
      ],
    },
    'LINEST': {
      method: 'linest',
      sizeOfResultArrayMethod: 'linestArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false },
      ],
    },
    'LOGEST': {
      method: 'logest',
      sizeOfResultArrayMethod: 'logestArraySize',
      vectorizationForbidden: true,
      parameters: [
        { argumentType: FunctionArgumentType.RANGE },
        { argumentType: FunctionArgumentType.RANGE, optionalArg: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true },
        { argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false },
      ],
    },
  }

  // ─── SORT ────────────────────────────────────────────────────────────────

  /**
   * SORT(range, sort_column, is_ascending, [col2, asc2, ...])
   * Sorts a range by one or more columns.
   */
  public sort(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const rangeVal = this.evaluateAsRange(ast.args[0], state)
    if (rangeVal instanceof CellError) return rangeVal

    const data = rangeVal.rawData()
    const rows = data.map(row => [...row])
    const width = rangeVal.width()

    // Collect sort keys: pairs of (colIndex, ascending)
    const sortKeys: Array<{ col: number, asc: boolean }> = []
    for (let i = 1; i < ast.args.length; i += 2) {
      const colVal = this.evaluateAst(ast.args[i], state)
      const ascVal = i + 1 < ast.args.length ? this.evaluateAst(ast.args[i + 1], state) : true

      if (colVal instanceof CellError) return colVal
      if (ascVal instanceof CellError) return ascVal
      const col = typeof colVal === 'number' ? Math.round(colVal) : 1
      const asc = typeof ascVal === 'boolean' ? ascVal : (typeof ascVal === 'number' ? ascVal !== 0 : true)

      if (col < 1 || col > width) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }
      sortKeys.push({ col: col - 1, asc })
    }

    if (sortKeys.length === 0) {
      sortKeys.push({ col: 0, asc: true })
    }

    rows.sort((a, b) => {
      for (const { col, asc } of sortKeys) {
        const va = a[col]
        const vb = b[col]
        const cmp = compareValues(va, vb)
        if (cmp !== 0) return asc ? cmp : -cmp
      }
      return 0
    })

    return SimpleRangeValue.onlyValues(rows)
  }

  /** Predicts the size of the SORT result array. */
  public sortArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(size.width, size.height)
  }

  // ─── UNIQUE ───────────────────────────────────────────────────────────────

  /**
   * UNIQUE(range)
   * Returns unique rows from the given range, in the order they first appear.
   */
  public unique(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const rangeVal = this.evaluateAsRange(ast.args[0], state)
    if (rangeVal instanceof CellError) return rangeVal

    const data = rangeVal.rawData()
    const seen = new Set<string>()
    const uniqueRows: InternalScalarValue[][] = []

    for (const row of data) {
      const key = getStableRowIdentity(row)
      if (!seen.has(key)) {
        seen.add(key)
        uniqueRows.push([...row])
      }
    }

    if (uniqueRows.length === 0) {
      return new CellError(ErrorType.VALUE, ErrorMessage.EmptyRange)
    }

    return SimpleRangeValue.onlyValues(uniqueRows)
  }

  /** Predicts the size of the UNIQUE result array. */
  public uniqueArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    // Worst case: all rows are unique
    return new ArraySize(size.width, size.height)
  }

  // ─── FLATTEN ─────────────────────────────────────────────────────────────

  /**
   * FLATTEN(range1, [range2, ...])
   * Flattens one or more ranges into a single column (row-major order).
   */
  public flatten(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const values: InternalScalarValue[] = []

    for (const argAst of ast.args) {
      const val = this.evaluateAsRange(argAst, state)
      if (val instanceof CellError) return val
      for (const v of val.valuesFromTopLeftCorner()) {
        values.push(v)
      }
    }

    return SimpleRangeValue.onlyValues(values.map(v => [v]))
  }

  /** Predicts the size of the FLATTEN result array. */
  public flattenArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    let totalElements = 0
    for (const arg of ast.args) {
      const size = this.arraySizeForAst(arg, state)
      totalElements += size.width * size.height
    }
    return new ArraySize(1, totalElements)
  }

  // ─── CHOOSECOLS ───────────────────────────────────────────────────────────

  /**
   * CHOOSECOLS(range, col1, [col2, ...])
   * Returns the specified columns from the range. Negative indices count from the end.
   */
  public choosecols(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const rangeVal = this.evaluateAsRange(ast.args[0], state)
    if (rangeVal instanceof CellError) return rangeVal

    const data = rangeVal.rawData()
    const width = rangeVal.width()

    const colIndices: number[] = []
    for (let i = 1; i < ast.args.length; i++) {
      const colVal = this.evaluateAst(ast.args[i], state)
      if (colVal instanceof CellError) return colVal
      const col = typeof colVal === 'number' ? Math.round(colVal) : 0
      if (col === 0 || Math.abs(col) > width) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }
      colIndices.push(col > 0 ? col - 1 : width + col)
    }

    const result = data.map(row => colIndices.map(ci => row[ci]))
    return SimpleRangeValue.onlyValues(result)
  }

  /** Predicts the size of the CHOOSECOLS result array. */
  public choosecolsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    const numCols = ast.args.length - 1
    return new ArraySize(numCols, size.height)
  }

  // ─── CHOOSEROWS ───────────────────────────────────────────────────────────

  /**
   * CHOOSEROWS(range, row1, [row2, ...])
   * Returns the specified rows from the range. Negative indices count from the end.
   */
  public chooserows(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const rangeVal = this.evaluateAsRange(ast.args[0], state)
    if (rangeVal instanceof CellError) return rangeVal

    const data = rangeVal.rawData()
    const height = rangeVal.height()

    const rowIndices: number[] = []
    for (let i = 1; i < ast.args.length; i++) {
      const rowVal = this.evaluateAst(ast.args[i], state)
      if (rowVal instanceof CellError) return rowVal
      const row = typeof rowVal === 'number' ? Math.round(rowVal) : 0
      if (row === 0 || Math.abs(row) > height) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }
      rowIndices.push(row > 0 ? row - 1 : height + row)
    }

    const result = rowIndices.map(ri => [...data[ri]])
    return SimpleRangeValue.onlyValues(result)
  }

  /** Predicts the size of the CHOOSEROWS result array. */
  public chooserowsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    const numRows = ast.args.length - 1
    return new ArraySize(size.width, numRows)
  }

  // ─── HSTACK ───────────────────────────────────────────────────────────────

  /**
   * HSTACK(range1, range2, ...)
   * Horizontally concatenates ranges side by side, padding shorter ones with empty values.
   */
  public hstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const ranges: SimpleRangeValue[] = []
    for (const argAst of ast.args) {
      const val = this.evaluateAsRange(argAst, state)
      if (val instanceof CellError) return val
      ranges.push(val)
    }

    const maxHeight = Math.max(...ranges.map(r => r.height()))
    const result: InternalScalarValue[][] = Array.from({ length: maxHeight }, () => [])

    for (const range of ranges) {
      const data = range.rawData()
      for (let row = 0; row < maxHeight; row++) {
        if (row < data.length) {
          result[row].push(...data[row])
        } else {
          result[row].push(...Array(range.width()).fill(EmptyValue))
        }
      }
    }

    return SimpleRangeValue.onlyValues(result)
  }

  /** Predicts the size of the HSTACK result array. */
  public hstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    let totalWidth = 0
    let maxHeight = 0
    for (const arg of ast.args) {
      const size = this.arraySizeForAst(arg, state)
      totalWidth += size.width
      maxHeight = Math.max(maxHeight, size.height)
    }
    return new ArraySize(totalWidth, maxHeight)
  }

  // ─── VSTACK ───────────────────────────────────────────────────────────────

  /**
   * VSTACK(range1, range2, ...)
   * Vertically stacks ranges, padding narrower ones with empty values.
   */
  public vstack(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const ranges: SimpleRangeValue[] = []
    for (const argAst of ast.args) {
      const val = this.evaluateAsRange(argAst, state)
      if (val instanceof CellError) return val
      ranges.push(val)
    }

    const maxWidth = Math.max(...ranges.map(r => r.width()))
    const result: InternalScalarValue[][] = []

    for (const range of ranges) {
      const data = range.rawData()
      for (const row of data) {
        const paddedRow = [...row]
        while (paddedRow.length < maxWidth) {
          paddedRow.push(EmptyValue)
        }
        result.push(paddedRow)
      }
    }

    return SimpleRangeValue.onlyValues(result)
  }

  /** Predicts the size of the VSTACK result array. */
  public vstackArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    let totalHeight = 0
    let maxWidth = 0
    for (const arg of ast.args) {
      const size = this.arraySizeForAst(arg, state)
      totalHeight += size.height
      maxWidth = Math.max(maxWidth, size.width)
    }
    return new ArraySize(maxWidth, totalHeight)
  }

  // ─── WRAPCOLS ─────────────────────────────────────────────────────────────

  /**
   * WRAPCOLS(range, wrap_count, [pad_with])
   * Flattens the range into a single sequence (row-major), then wraps into columns of wrap_count rows.
   */
  public wrapcols(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WRAPCOLS'),
      (range: SimpleRangeValue, wrapCount: number, padWith: InternalScalarValue) => {
        const values = range.valuesFromTopLeftCorner()
        const pad = padWith !== undefined ? padWith : EmptyValue
        const numCols = Math.ceil(values.length / wrapCount)
        const result: InternalScalarValue[][] = Array.from({ length: wrapCount }, () =>
          Array(numCols).fill(pad)
        )
        for (let i = 0; i < values.length; i++) {
          const col = Math.floor(i / wrapCount)
          const row = i % wrapCount
          result[row][col] = values[i]
        }
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /** Predicts the size of the WRAPCOLS result array. */
  public wrapcolsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) return ArraySize.error()
    const rangeSize = this.arraySizeForAst(ast.args[0], state)
    const totalElements = rangeSize.width * rangeSize.height
    const wrapArg = ast.args[1]
    if (wrapArg.type !== AstNodeType.NUMBER) {
      const maxWidth = Math.max(1, Math.min(this.config.maxColumns, totalElements))
      const maxHeight = Math.max(1, Math.min(this.config.maxRows, totalElements))
      return new ArraySize(maxWidth, maxHeight)
    }
    const wrapCount = wrapArg.value
    if (wrapCount < 1) return ArraySize.error()
    const numCols = Math.ceil(totalElements / wrapCount)
    return new ArraySize(numCols, wrapCount)
  }

  // ─── WRAPROWS ─────────────────────────────────────────────────────────────

  /**
   * WRAPROWS(range, wrap_count, [pad_with])
   * Flattens the range into a single sequence (row-major), then wraps into rows of wrap_count columns.
   */
  public wraprows(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('WRAPROWS'),
      (range: SimpleRangeValue, wrapCount: number, padWith: InternalScalarValue) => {
        const values = range.valuesFromTopLeftCorner()
        const pad = padWith !== undefined ? padWith : EmptyValue
        const numRows = Math.ceil(values.length / wrapCount)
        const result: InternalScalarValue[][] = Array.from({ length: numRows }, () =>
          Array(wrapCount).fill(pad)
        )
        for (let i = 0; i < values.length; i++) {
          const row = Math.floor(i / wrapCount)
          const col = i % wrapCount
          result[row][col] = values[i]
        }
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /** Predicts the size of the WRAPROWS result array. */
  public wraprowsArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) return ArraySize.error()
    const rangeSize = this.arraySizeForAst(ast.args[0], state)
    const totalElements = rangeSize.width * rangeSize.height
    const wrapArg = ast.args[1]
    if (wrapArg.type !== AstNodeType.NUMBER) {
      const maxWidth = Math.max(1, Math.min(this.config.maxColumns, totalElements))
      const maxHeight = Math.max(1, Math.min(this.config.maxRows, totalElements))
      return new ArraySize(maxWidth, maxHeight)
    }
    const wrapCount = wrapArg.value
    if (wrapCount < 1) return ArraySize.error()
    const numRows = Math.ceil(totalElements / wrapCount)
    return new ArraySize(wrapCount, numRows)
  }

  // ─── TOCOL ────────────────────────────────────────────────────────────────

  /**
   * TOCOL(range, [ignore], [scan_by_column])
   * Reshapes the range into a single column.
   * ignore: 0=keep all, 1=ignore blanks, 2=ignore errors, 3=ignore both.
   * scan_by_column: if true, iterate column-by-column instead of row-by-row.
   */
  public tocol(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TOCOL'),
      (range: SimpleRangeValue, ignore: number, scanByColumn: boolean) => {
        const values = scanByColumn
          ? collectColumnMajor(range.rawData(), range.width(), range.height())
          : range.valuesFromTopLeftCorner()

        const filtered = values.filter(v => {
          if (ignore === 1 || ignore === 3) {
            if (v === EmptyValue || v === '') return false
          }
          if (ignore === 2 || ignore === 3) {
            if (v instanceof CellError) return false
          }
          return true
        })

        if (filtered.length === 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyRange)
        }

        return SimpleRangeValue.onlyValues(filtered.map(v => [v]))
      }
    )
  }

  /** Predicts the size of the TOCOL result array. */
  public tocolArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(1, size.width * size.height)
  }

  // ─── TOROW ────────────────────────────────────────────────────────────────

  /**
   * TOROW(range, [ignore], [scan_by_column])
   * Reshapes the range into a single row.
   */
  public torow(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TOROW'),
      (range: SimpleRangeValue, ignore: number, scanByColumn: boolean) => {
        const values = scanByColumn
          ? collectColumnMajor(range.rawData(), range.width(), range.height())
          : range.valuesFromTopLeftCorner()

        const filtered = values.filter(v => {
          if (ignore === 1 || ignore === 3) {
            if (v === EmptyValue || v === '') return false
          }
          if (ignore === 2 || ignore === 3) {
            if (v instanceof CellError) return false
          }
          return true
        })

        if (filtered.length === 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyRange)
        }

        return SimpleRangeValue.onlyValues([filtered])
      }
    )
  }

  /** Predicts the size of the TOROW result array. */
  public torowArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(size.width * size.height, 1)
  }

  // ─── SEQUENCE ─────────────────────────────────────────────────────────────

  /**
   * SEQUENCE(rows, [columns], [start], [step])
   * Generates a rows×columns array of sequential numbers starting at start with given step.
   */
  public sequence(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SEQUENCE'),
      (rows: number, columns: number, start: number, step: number) => {
        const result: InternalScalarValue[][] = []
        let current = start
        for (let r = 0; r < rows; r++) {
          const row: InternalScalarValue[] = []
          for (let c = 0; c < columns; c++) {
            row.push(current)
            current += step
          }
          result.push(row)
        }
        return SimpleRangeValue.onlyValues(result)
      }
    )
  }

  /** Predicts the size of the SEQUENCE result array. */
  public sequenceArraySize(ast: ProcedureAst, _state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const rowsArg = ast.args[0]
    const colsArg = ast.args[1]
    // When arguments are cell references (not literals), use a minimal
    // non-scalar fallback. ArrayValue.resize() will grow to the actual
    // computed size and tolerates actual > predicted.
    const rows = rowsArg.type === AstNodeType.NUMBER ? Math.max(1, rowsArg.value) : 2
    const cols = colsArg !== undefined && colsArg.type === AstNodeType.NUMBER ? Math.max(1, colsArg.value) : 1
    return new ArraySize(cols, rows)
  }

  // ─── FREQUENCY ────────────────────────────────────────────────────────────

  /**
   * FREQUENCY(data_array, bins_array)
   * Returns a frequency distribution as a vertical array.
   * The result has bins.length + 1 rows: one per bin, plus one for values > last bin.
   */
  public frequency(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const dataVal = this.evaluateAsRange(ast.args[0], state)
    if (dataVal instanceof CellError) return dataVal
    const binsVal = this.evaluateAsRange(ast.args[1], state)
    if (binsVal instanceof CellError) return binsVal

    const dataNumbers = dataVal.valuesFromTopLeftCorner()
      .filter(isExtendedNumber)
      .map(v => getRawValue(v as number | RichNumber))

    const bins = binsVal.valuesFromTopLeftCorner()
      .filter(isExtendedNumber)
      .map(v => getRawValue(v as number | RichNumber))

    bins.sort((a, b) => a - b)

    const counts = Array(bins.length + 1).fill(0)
    for (const val of dataNumbers) {
      let placed = false
      for (let i = 0; i < bins.length; i++) {
        if (val <= bins[i]) {
          counts[i]++
          placed = true
          break
        }
      }
      if (!placed) counts[bins.length]++
    }

    return SimpleRangeValue.onlyValues(counts.map(c => [c]))
  }

  /** Predicts the size of the FREQUENCY result array. */
  public frequencyArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2) return ArraySize.error()
    const binsSize = this.arraySizeForAst(ast.args[1], state)
    return new ArraySize(1, binsSize.width * binsSize.height + 1)
  }

  // ─── MDETERM ─────────────────────────────────────────────────────────────

  /**
   * MDETERM(matrix)
   * Returns the determinant of a square matrix.
   */
  public mdeterm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MDETERM'),
      (matrix: SimpleRangeValue) => {
        if (!matrix.hasOnlyNumbers()) {
          return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
        }
        if (matrix.width() !== matrix.height()) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ArrayDimensions)
        }
        const nums = matrix.rawNumbers()
        return this.determinant(nums)
      }
    )
  }

  // ─── MINVERSE ─────────────────────────────────────────────────────────────

  /**
   * MINVERSE(matrix)
   * Returns the inverse of a square matrix using Gauss-Jordan elimination.
   */
  public minverse(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const matrixVal = this.evaluateAsRange(ast.args[0], state)
    if (matrixVal instanceof CellError) return matrixVal

    if (!matrixVal.hasOnlyNumbers()) {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
    }

    if (matrixVal.width() !== matrixVal.height()) {
      return new CellError(ErrorType.VALUE, ErrorMessage.ArrayDimensions)
    }

    const n = matrixVal.width()
    const nums = matrixVal.rawNumbers()

    // Build augmented matrix [A | I]
    const aug = nums.map((row, i) => {
      const identity = Array(n).fill(0)
      identity[i] = 1
      return [...row, ...identity]
    })

    // Gauss-Jordan elimination
    for (let col = 0; col < n; col++) {
      let maxRow = col
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
          maxRow = row
        }
      }
      ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

      if (Math.abs(aug[col][col]) < 1e-12) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      }

      const pivot = aug[col][col]
      for (let j = col; j < 2 * n; j++) {
        aug[col][j] /= pivot
      }

      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = aug[row][col]
          for (let j = col; j < 2 * n; j++) {
            aug[row][j] -= factor * aug[col][j]
          }
        }
      }
    }

    const result = aug.map(row => row.slice(n))
    return SimpleRangeValue.onlyNumbers(result)
  }

  /** Predicts the size of the MINVERSE result array. */
  public minverseArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(size.width, size.height)
  }

  // ─── MUNIT ───────────────────────────────────────────────────────────────

  /**
   * MUNIT(dimension)
   * Returns a dimension × dimension identity matrix.
   */
  public munit(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MUNIT'),
      (dimension: number) => {
        const result: number[][] = []
        for (let i = 0; i < dimension; i++) {
          result.push(Array.from({ length: dimension }, (_, j) => i === j ? 1 : 0))
        }
        return SimpleRangeValue.onlyNumbers(result)
      }
    )
  }

  /** Predicts the size of the MUNIT result array. */
  public munitArraySize(ast: ProcedureAst, _state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    const dimArg = ast.args[0]
    const dim = dimArg.type === AstNodeType.NUMBER ? Math.max(1, dimArg.value) : 2
    return new ArraySize(dim, dim)
  }

  // ─── GROWTH ───────────────────────────────────────────────────────────────

  /**
   * GROWTH(known_y, [known_x], [new_x], [const])
   * Computes predicted exponential growth values: y = b * m^x.
   */
  public growth(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const knownYVal = this.evaluateAsRange(ast.args[0], state)
    if (knownYVal instanceof CellError) return knownYVal

    const knownY = extractNumbers(knownYVal)
    if (knownY === null || knownY.some(v => v <= 0)) {
      return new CellError(ErrorType.NUM, ErrorMessage.NaN)
    }

    const n = knownY.length

    let knownX: number[]
    if (ast.args.length > 1 && ast.args[1].type !== AstNodeType.EMPTY) {
      const knownXVal = this.evaluateAsRange(ast.args[1], state)
      if (knownXVal instanceof CellError) return knownXVal
      const extracted = extractNumbers(knownXVal)
      if (extracted === null || extracted.length !== n) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
      }
      knownX = extracted
    } else {
      knownX = Array.from({ length: n }, (_, i) => i + 1)
    }

    let newX: number[]
    let newXHeight = knownYVal.height()
    let newXWidth = knownYVal.width()
    if (ast.args.length > 2 && ast.args[2].type !== AstNodeType.EMPTY) {
      const newXVal = this.evaluateAsRange(ast.args[2], state)
      if (newXVal instanceof CellError) return newXVal
      const extracted = extractNumbers(newXVal)
      if (extracted === null) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      newX = extracted
      newXHeight = newXVal.height()
      newXWidth = newXVal.width()
    } else {
      newX = knownX
    }

    const useConst = ast.args.length > 3
      ? (() => {
        const v = this.evaluateAst(ast.args[3], state)
        return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : true)
      })()
      : true

    const lnY = knownY.map(v => Math.log(v))
    const { slope, intercept } = linearRegression(knownX, lnY, useConst)
    const b = Math.exp(intercept)
    const m = Math.exp(slope)

    const resultFlat = newX.map(x => b * Math.pow(m, x))
    const result = reshapeToMatrix(resultFlat, newXHeight, newXWidth)
    return SimpleRangeValue.onlyNumbers(result)
  }

  /** Predicts the size of the GROWTH result array. */
  public growthArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    if (ast.args.length > 2 && ast.args[2].type !== AstNodeType.EMPTY) {
      const size = this.arraySizeForAst(ast.args[2], state)
      return new ArraySize(size.width, size.height)
    }
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(size.width, size.height)
  }

  // ─── TREND ────────────────────────────────────────────────────────────────

  /**
   * TREND(known_y, [known_x], [new_x], [const])
   * Computes predicted linear trend values: y = m*x + b.
   */
  public trend(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const knownYVal = this.evaluateAsRange(ast.args[0], state)
    if (knownYVal instanceof CellError) return knownYVal

    const knownY = extractNumbers(knownYVal)
    if (knownY === null) {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
    }

    const n = knownY.length

    let knownX: number[]
    if (ast.args.length > 1 && ast.args[1].type !== AstNodeType.EMPTY) {
      const knownXVal = this.evaluateAsRange(ast.args[1], state)
      if (knownXVal instanceof CellError) return knownXVal
      const extracted = extractNumbers(knownXVal)
      if (extracted === null || extracted.length !== n) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
      }
      knownX = extracted
    } else {
      knownX = Array.from({ length: n }, (_, i) => i + 1)
    }

    let newX: number[]
    let newXHeight = knownYVal.height()
    let newXWidth = knownYVal.width()
    if (ast.args.length > 2 && ast.args[2].type !== AstNodeType.EMPTY) {
      const newXVal = this.evaluateAsRange(ast.args[2], state)
      if (newXVal instanceof CellError) return newXVal
      const extracted = extractNumbers(newXVal)
      if (extracted === null) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      newX = extracted
      newXHeight = newXVal.height()
      newXWidth = newXVal.width()
    } else {
      newX = knownX
    }

    const useConst = ast.args.length > 3
      ? (() => {
        const v = this.evaluateAst(ast.args[3], state)
        return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : true)
      })()
      : true

    const { slope, intercept } = linearRegression(knownX, knownY, useConst)
    const resultFlat = newX.map(x => slope * x + intercept)
    const result = reshapeToMatrix(resultFlat, newXHeight, newXWidth)
    return SimpleRangeValue.onlyNumbers(result)
  }

  /** Predicts the size of the TREND result array. */
  public trendArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    if (ast.args.length > 2 && ast.args[2].type !== AstNodeType.EMPTY) {
      const size = this.arraySizeForAst(ast.args[2], state)
      return new ArraySize(size.width, size.height)
    }
    const size = this.arraySizeForAst(ast.args[0], state)
    return new ArraySize(size.width, size.height)
  }

  // ─── LINEST ───────────────────────────────────────────────────────────────

  /**
   * LINEST(known_y, [known_x], [const], [stats])
   * Returns linear regression statistics as a 2D array.
   * Row 1: [slope, intercept]
   * Rows 2-5 (when stats=TRUE): standard errors, R², F-stat, SS values.
   */
  public linest(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const knownYVal = this.evaluateAsRange(ast.args[0], state)
    if (knownYVal instanceof CellError) return knownYVal

    const knownY = extractNumbers(knownYVal)
    if (knownY === null) {
      return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
    }

    const n = knownY.length

    let knownX: number[]
    if (ast.args.length > 1 && ast.args[1].type !== AstNodeType.EMPTY) {
      const knownXVal = this.evaluateAsRange(ast.args[1], state)
      if (knownXVal instanceof CellError) return knownXVal
      const extracted = extractNumbers(knownXVal)
      if (extracted === null || extracted.length !== n) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
      }
      knownX = extracted
    } else {
      knownX = Array.from({ length: n }, (_, i) => i + 1)
    }

    const useConst = ast.args.length > 2
      ? (() => { const v = this.evaluateAst(ast.args[2], state); return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : true) })()
      : true

    const returnStats = ast.args.length > 3
      ? (() => { const v = this.evaluateAst(ast.args[3], state); return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : false) })()
      : false

    const { slope, intercept } = linearRegression(knownX, knownY, useConst)

    if (!returnStats) {
      return SimpleRangeValue.onlyNumbers([[slope, intercept]])
    }

    const yHat = knownX.map(x => slope * x + intercept)
    const yMean = knownY.reduce((a, b) => a + b, 0) / n

    const ssResid = knownX.reduce((sum, _, i) => sum + Math.pow(knownY[i] - yHat[i], 2), 0)
    const ssReg = useConst
      ? knownX.reduce((sum, _, i) => sum + Math.pow(yHat[i] - yMean, 2), 0)
      : yHat.reduce((sum, y) => sum + y * y, 0)
    const ssTot = useConst
      ? ssResid + ssReg
      : knownY.reduce((sum, y) => sum + y * y, 0)
    const rSquared = ssTot === 0 ? 1 : ssReg / ssTot

    const df = useConst ? n - 2 : n - 1
    const seY = df > 0 ? Math.sqrt(ssResid / df) : 0

    const xMean = knownX.reduce((a, b) => a + b, 0) / n
    const sxx = knownX.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0)
    const seSlope = sxx > 0 ? seY / Math.sqrt(sxx) : 0
    const seIntercept = useConst && sxx > 0
      ? seY * Math.sqrt(knownX.reduce((sum, x) => sum + x * x, 0) / (n * sxx))
      : 0

    const fStat = seY > 0 && df > 0 ? (ssReg / 1) / (ssResid / df) : 0

    return SimpleRangeValue.onlyNumbers([
      [slope, intercept],
      [seSlope, seIntercept],
      [rSquared, seY],
      [fStat, df],
      [ssReg, ssResid],
    ])
  }

  /** Predicts the size of the LINEST result array. */
  public linestArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    // When 4 args are present, check if the stats argument (arg[3]) is a literal FALSE value.
    // If it is, we can statically predict a 1-row result; otherwise assume stats=TRUE (5 rows).
    if (ast.args.length <= 3) return new ArraySize(2, 1)
    const statsArg = ast.args[3]
    const statsIsLiteralFalse = isLiteralFalsy(statsArg)
    return statsIsLiteralFalse ? new ArraySize(2, 1) : new ArraySize(2, 5)
  }

  // ─── LOGEST ───────────────────────────────────────────────────────────────

  /**
   * LOGEST(known_y, [known_x], [const], [stats])
   * Returns exponential regression statistics.
   * Row 1: [m, b] where y = b * m^x.
   * Additional rows match LINEST format when stats=TRUE.
   */
  public logest(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const knownYVal = this.evaluateAsRange(ast.args[0], state)
    if (knownYVal instanceof CellError) return knownYVal

    const knownY = extractNumbers(knownYVal)
    if (knownY === null || knownY.some(v => v <= 0)) {
      return new CellError(ErrorType.NUM, ErrorMessage.NaN)
    }

    const n = knownY.length

    let knownX: number[]
    if (ast.args.length > 1 && ast.args[1].type !== AstNodeType.EMPTY) {
      const knownXVal = this.evaluateAsRange(ast.args[1], state)
      if (knownXVal instanceof CellError) return knownXVal
      const extracted = extractNumbers(knownXVal)
      if (extracted === null || extracted.length !== n) {
        return new CellError(ErrorType.VALUE, ErrorMessage.EqualLength)
      }
      knownX = extracted
    } else {
      knownX = Array.from({ length: n }, (_, i) => i + 1)
    }

    const useConst = ast.args.length > 2
      ? (() => { const v = this.evaluateAst(ast.args[2], state); return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : true) })()
      : true

    const returnStats = ast.args.length > 3
      ? (() => { const v = this.evaluateAst(ast.args[3], state); return typeof v === 'boolean' ? v : (typeof v === 'number' ? v !== 0 : false) })()
      : false

    const lnY = knownY.map(v => Math.log(v))
    const { slope, intercept } = linearRegression(knownX, lnY, useConst)
    const m = Math.exp(slope)
    const b = Math.exp(intercept)

    if (!returnStats) {
      return SimpleRangeValue.onlyNumbers([[m, b]])
    }

    const yHat = knownX.map(x => slope * x + intercept)
    const yMean = lnY.reduce((a, v) => a + v, 0) / n

    const ssResid = knownX.reduce((sum, _, i) => sum + Math.pow(lnY[i] - yHat[i], 2), 0)
    const ssReg = useConst
      ? knownX.reduce((sum, _, i) => sum + Math.pow(yHat[i] - yMean, 2), 0)
      : yHat.reduce((sum, y) => sum + y * y, 0)
    const ssTot = useConst
      ? ssResid + ssReg
      : lnY.reduce((sum, y) => sum + y * y, 0)
    const rSquared = ssTot === 0 ? 1 : ssReg / ssTot

    const df = useConst ? n - 2 : n - 1
    const seY = df > 0 ? Math.sqrt(ssResid / df) : 0

    const xMean = knownX.reduce((a, v) => a + v, 0) / n
    const sxx = knownX.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0)
    const seSlope = sxx > 0 ? seY / Math.sqrt(sxx) : 0
    const seIntercept = useConst && sxx > 0
      ? seY * Math.sqrt(knownX.reduce((sum, x) => sum + x * x, 0) / (n * sxx))
      : 0

    const fStat = seY > 0 && df > 0 ? (ssReg / 1) / (ssResid / df) : 0

    return SimpleRangeValue.onlyNumbers([
      [m, b],
      [seSlope, seIntercept],
      [rSquared, seY],
      [fStat, df],
      [ssReg, ssResid],
    ])
  }

  /** Predicts the size of the LOGEST result array. */
  public logestArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1) return ArraySize.error()
    // When 4 args are present, check if the stats argument (arg[3]) is a literal FALSE value.
    // If it is, we can statically predict a 1-row result; otherwise assume stats=TRUE (5 rows).
    if (ast.args.length <= 3) return new ArraySize(2, 1)
    const statsArg = ast.args[3]
    const statsIsLiteralFalse = isLiteralFalsy(statsArg)
    return statsIsLiteralFalse ? new ArraySize(2, 1) : new ArraySize(2, 5)
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Evaluates an AST node and coerces the result to a SimpleRangeValue.
   * Handles the case where evaluateAst coerces a 1x1 range to a scalar value.
   */
  private evaluateAsRange(ast: Ast, state: InterpreterState): SimpleRangeValue | CellError {
    const val = this.evaluateAst(ast, state)
    if (val instanceof SimpleRangeValue) return val
    if (val instanceof CellError) return val
    // evaluateAst coerces 1x1 ranges to scalars — wrap it back
    return SimpleRangeValue.fromScalar(val as InternalScalarValue)
  }

  /**
   * Computes the determinant of a square matrix using Gaussian elimination with partial pivoting.
   */
  private determinant(matrix: number[][]): number {
    const n = matrix.length
    const m = matrix.map(row => [...row])
    let det = 1

    for (let i = 0; i < n; i++) {
      let maxRow = i
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(m[k][i]) > Math.abs(m[maxRow][i])) maxRow = k
      }
      if (maxRow !== i) {
        ;[m[i], m[maxRow]] = [m[maxRow], m[i]]
        det *= -1
      }
      if (Math.abs(m[i][i]) < 1e-12) return 0
      det *= m[i][i]
      for (let k = i + 1; k < n; k++) {
        const factor = m[k][i] / m[i][i]
        for (let j = i; j < n; j++) {
          m[k][j] -= factor * m[i][j]
        }
      }
    }

    return det
  }
}

// ─── Module-level helpers ─────────────────────────────────────────────────────

/**
 * Returns true if the given AST node is a statically-determinable falsy literal.
 * This includes the numeric literal 0 and a call to FALSE() with no arguments.
 * Used in size-prediction methods to avoid over-allocating spill regions at parse time.
 */
function isLiteralFalsy(ast: Ast): boolean {
  if (ast.type === AstNodeType.NUMBER) {
    return ast.value === 0
  }
  if (ast.type === AstNodeType.FUNCTION_CALL) {
    return ast.procedureName === 'FALSE' && ast.args.length === 0
  }
  return false
}

/**
 * Compares two InternalScalarValues for sorting.
 * Numbers sort before strings, strings before booleans, booleans before errors, errors before empty.
 */
function compareValues(a: InternalScalarValue, b: InternalScalarValue): number {
  if (isExtendedNumber(a) && isExtendedNumber(b)) return getRawValue(a) - getRawValue(b)
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return typeOrder(a) - typeOrder(b)
}

/**
 * Produces a deterministic identity key for a row of scalar values.
 *
 * This avoids collisions and instability from serializing runtime objects directly
 * (for example `CellError` instances with different `type`s or `RichNumber`
 * instances with different detailed number kinds).
 */
function getStableRowIdentity(row: InternalScalarValue[]): string {
  return row.map(serializeInternalScalarValue).join('|')
}

/**
 * Serializes an InternalScalarValue into a stable, type-aware token.
 */
function serializeInternalScalarValue(value: InternalScalarValue): string {
  if (value === EmptyValue) {
    return JSON.stringify(['empty'])
  }
  if (value instanceof CellError) {
    return JSON.stringify(['error', value.type, value.message ?? ''])
  }
  if (isExtendedNumber(value)) {
    if (value instanceof RichNumber) {
      return JSON.stringify([
        'rich-number',
        value.getDetailedType(),
        value.format ?? '',
        normalizeNumberForIdentity(value.val),
      ])
    }
    return JSON.stringify(['number', normalizeNumberForIdentity(value)])
  }
  if (typeof value === 'string') {
    return JSON.stringify(['string', value])
  }
  if (typeof value === 'boolean') {
    return JSON.stringify(['boolean', value])
  }
  return JSON.stringify(['unknown'])
}

/**
 * Normalizes numeric edge cases for identity generation.
 */
function normalizeNumberForIdentity(value: number): string {
  if (Object.is(value, -0)) {
    return '-0'
  }
  if (Number.isNaN(value)) {
    return 'NaN'
  }
  if (value === Number.POSITIVE_INFINITY) {
    return 'Infinity'
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return '-Infinity'
  }
  return String(value)
}

function typeOrder(v: InternalScalarValue): number {
  if (isExtendedNumber(v)) return 0
  if (typeof v === 'string') return 1
  if (typeof v === 'boolean') return 2
  if (v instanceof CellError) return 3
  return 4 // EmptyValue
}

/**
 * Collects values from a 2D array in column-major order.
 */
function collectColumnMajor(data: InternalScalarValue[][], width: number, height: number): InternalScalarValue[] {
  const result: InternalScalarValue[] = []
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      result.push(data[row][col])
    }
  }
  return result
}

/**
 * Extracts all numeric values from a SimpleRangeValue as a flat number array.
 * Returns null if any value is non-numeric.
 */
function extractNumbers(range: SimpleRangeValue): number[] | null {
  const values = range.valuesFromTopLeftCorner()
  const numbers: number[] = []
  for (const v of values) {
    if (!isExtendedNumber(v)) return null
    numbers.push(getRawValue(v))
  }
  return numbers
}

/**
 * Simple linear regression: y = slope * x + intercept.
 * When useConst is false, forces intercept to 0.
 */
function linearRegression(x: number[], y: number[], useConst: boolean): { slope: number, intercept: number } {
  const n = x.length
  if (n === 0) return { slope: 0, intercept: 0 }

  if (!useConst) {
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const slope = sumXX === 0 ? 0 : sumXY / sumXX
    return { slope, intercept: 0 }
  }

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

/**
 * Reshapes a flat array into a rows × cols 2D matrix (row-major).
 */
function reshapeToMatrix(flat: number[], rows: number, cols: number): number[][] {
  const result: number[][] = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      row.push(idx < flat.length ? flat[idx++] : 0)
    }
    result.push(row)
  }
  return result
}
