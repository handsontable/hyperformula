/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import { ArraySize } from '../../ArraySize'
import { CellError, ErrorType } from '../../Cell'
import { ErrorMessage } from '../../error-message'
import { Ast, AstNodeType, ProcedureAst } from '../../parser'
import { InterpreterState } from '../InterpreterState'
import { InterpreterValue } from '../InterpreterValue'
import { SimpleRangeValue } from '../../SimpleRangeValue'
import { FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions } from './FunctionPlugin'

/**
 * Plugin implementing the SEQUENCE spreadsheet function.
 *
 * SEQUENCE(rows, [cols], [start], [step]) returns a rows×cols array of
 * sequential numbers starting at `start` and incrementing by `step`.
 */
export class SequencePlugin extends FunctionPlugin implements FunctionPluginTypecheck<SequencePlugin> {
  /**
   * Minimum valid value for the `rows` and `cols` arguments.
   * Extracted to avoid duplicating the check between `sequence()` (runtime) and
   * `sequenceArraySize()` (parse time).
   */
  private static readonly MIN_DIMENSION = 1

  /** Returns true when `n` is a finite number at least {@link MIN_DIMENSION}. */
  private static isValidDimension(n: number): boolean {
    return Number.isFinite(n) && n >= SequencePlugin.MIN_DIMENSION
  }

  /**
   * Parses a literal dimension from an AST node at parse time.
   * Handles a NUMBER node with an optional sign (e.g. `3`, `+3`, `-2`) via `signedNumberLiteral`,
   * STRING nodes via numeric coercion, and TRUE()/FALSE() function calls (returning 1/0).
   * Returns undefined for non-literal nodes (cell refs, formulas, binary ops).
   */
  private parseLiteralDimension(node: Ast): number | undefined {
    const signedNumber = this.signedNumberLiteral(node)
    if (signedNumber !== undefined) {
      return Math.trunc(signedNumber)
    }
    if (node.type === AstNodeType.STRING) {
      const parsed = Number(node.value)
      return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
    }
    if (node.type === AstNodeType.FUNCTION_CALL) {
      if (node.procedureName === 'TRUE' && node.args.length === 0) {
        return 1
      }
      if (node.procedureName === 'FALSE' && node.args.length === 0) {
        return 0
      }
    }
    return undefined
  }

  public static implementedFunctions: ImplementedFunctions = {
    'SEQUENCE': {
      method: 'sequence',
      sizeOfResultArrayMethod: 'sequenceArraySize',
      parameters: [
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true },
      ],
      vectorizationForbidden: true,
    },
  }

  /**
   * Corresponds to SEQUENCE(rows, [cols], [start], [step])
   *
   * Returns a rows×cols array of sequential numbers starting at `start`
   * and incrementing by `step`, filled row-major.
   *
   * Note: dynamic arguments (cell references, formulas) for `rows` or `cols`
   * cause a size mismatch between parse-time prediction and runtime result,
   * which results in a #VALUE! error. Use literal numbers for rows and cols.
   *
   * @param {ProcedureAst} ast - The parsed function call AST node.
   * @param {InterpreterState} state - Current interpreter evaluation state.
   */
  public sequence(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SEQUENCE'),
      (rows: number, cols: number, start: number, step: number) => {
        if (!Number.isFinite(rows) || !Number.isFinite(cols)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }

        if (rows < 0 || cols < 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }

        const numRows = Math.trunc(rows)
        const numCols = Math.trunc(cols)

        if (!SequencePlugin.isValidDimension(numRows) || !SequencePlugin.isValidDimension(numCols)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
        }

        if (numRows > this.config.maxRows || numCols > this.config.maxColumns) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }

        const result: number[][] = []
        for (let r = 0; r < numRows; r++) {
          const row: number[] = []
          for (let c = 0; c < numCols; c++) {
            row.push(start + (r * numCols + c) * step)
          }
          result.push(row)
        }

        return SimpleRangeValue.onlyNumbers(result)
      }
    )
  }

  /**
   * Predicts the output array size for SEQUENCE at parse time.
   *
   * Handles NUMBER and STRING literals for rows/cols via `parseLiteralDimension`.
   * Non-literal args (cell refs, formulas, unary/binary ops) fall back to 1,
   * which will cause a size mismatch at eval time when the actual result is larger.
   *
   * @param {ProcedureAst} ast - The parsed function call AST node.
   * @param {InterpreterState} _state - Current interpreter evaluation state (unused).
   */
  public sequenceArraySize(ast: ProcedureAst, _state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 4) {
      return ArraySize.error()
    }

    const rowsArg = ast.args[0]
    const colsArg = ast.args.length > 1 ? ast.args[1] : undefined

    // Non-literal rows (cell ref, formula, unary/binary op): size unknown at parse time.
    // Fall back to scalar so the engine creates a ScalarFormulaVertex instead of an
    // ArrayFormulaVertex. The actual evaluation will propagate errors or return #VALUE!
    // via the Exporter if the result is larger than 1×1.
    if (rowsArg.type === AstNodeType.EMPTY) {
      return ArraySize.error()
    }
    const rows = this.parseLiteralDimension(rowsArg)
    if (rows === undefined) {
      return ArraySize.error()
    }

    const cols = (colsArg === undefined || colsArg.type === AstNodeType.EMPTY)
      ? 1
      : this.parseLiteralDimension(colsArg)
    if (cols === undefined) {
      return ArraySize.error()
    }

    if (!SequencePlugin.isValidDimension(rows) || !SequencePlugin.isValidDimension(cols)) {
      return ArraySize.error()
    }

    if (rows > this.config.maxRows || cols > this.config.maxColumns) {
      return ArraySize.error()
    }

    return new ArraySize(cols, rows)
  }
}
