/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

export class SequencePlugin extends FunctionPlugin implements FunctionPluginTypecheck<SequencePlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SEQUENCE': {
      method: 'sequence',
      sizeOfResultArrayMethod: 'sequenceArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.NUMBER},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1},
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
   * @param ast
   * @param state
   */
  public sequence(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SEQUENCE'),
      (rows: number, cols: number, start: number, step: number) => {
        // runFunction coerces AstNodeType.EMPTY args to 0 for NUMBER params.
        // Re-apply defaults for any position that was an empty arg in the formula,
        // matching Excel's behavior where =SEQUENCE(3,2,,) treats ,, as default (1).
        const effectiveCols  = ast.args[1]?.type === AstNodeType.EMPTY ? 1 : cols
        const effectiveStart = ast.args[2]?.type === AstNodeType.EMPTY ? 1 : start
        const effectiveStep  = ast.args[3]?.type === AstNodeType.EMPTY ? 1 : step

        const numRows = Math.trunc(rows)
        const numCols = Math.trunc(effectiveCols)

        if (numRows < 1 || numCols < 1) {
          return new CellError(ErrorType.NUM, ErrorMessage.LessThanOne)
        }

        const result: number[][] = []
        for (let r = 0; r < numRows; r++) {
          const row: number[] = []
          for (let c = 0; c < numCols; c++) {
            row.push(effectiveStart + (r * numCols + c) * effectiveStep)
          }
          result.push(row)
        }

        return SimpleRangeValue.onlyNumbers(result)
      }
    )
  }

  /**
   * Predicts the output array size for SEQUENCE at parse time.
   * Uses literal argument values when available; falls back to 1×1 otherwise.
   *
   * @param ast
   * @param state
   */
  public sequenceArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 1 || ast.args.length > 4) {
      return ArraySize.error()
    }

    const rowsArg = ast.args[0]
    const colsArg = ast.args.length > 1 ? ast.args[1] : undefined

    const rows = rowsArg.type === AstNodeType.NUMBER ? Math.trunc(rowsArg.value) : 1
    const cols = (colsArg === undefined || colsArg.type === AstNodeType.EMPTY)
      ? 1
      : colsArg.type === AstNodeType.NUMBER
        ? Math.trunc(colsArg.value)
        : 1

    if (rows < 1 || cols < 1) {
      return ArraySize.error()
    }

    return new ArraySize(cols, rows)
  }
}
