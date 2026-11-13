/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {InterpreterState} from '../InterpreterState'
import {EmptyValue, InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Interpreter plugin containing MEDIAN function
 */
export class CountBlankPlugin extends FunctionPlugin implements FunctionPluginTypecheck<CountBlankPlugin> {

  public static implementedFunctions: ImplementedFunctions = {
    'COUNTBLANK': {
      method: 'countblank',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
  }

  public countblank(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    const numberOfCellsLeftOut = this.numberOfCellsLeftOutOfExpandedRanges(ast.args, state)
    return this.runFunction(ast.args, state, this.metadata('COUNTBLANK'), (...args: RawScalarValue[]) => {
      let counter = numberOfCellsLeftOut
      args.forEach((arg) => {
        if (arg === EmptyValue) {
          counter++
        }
      })
      return counter
    })
  }

  /**
   * Returns the number of cells that open-ended ranges among the arguments leave out of the values they expand to.
   * An open-ended range expands only as far as the sheets hold cells, and every cell past them is empty.
   * Only the arguments that can refer to a range without calling a function are checked, so no function is evaluated twice.
   */
  private numberOfCellsLeftOutOfExpandedRanges(args: Ast[], state: InterpreterState): number {
    let numberOfCells = 0
    for (let argAst of args) {
      while (argAst.type === AstNodeType.PARENTHESIS) {
        argAst = argAst.expression
      }
      if (argAst.type !== AstNodeType.CELL_RANGE && argAst.type !== AstNodeType.NAMED_EXPRESSION) {
        continue
      }
      const value = this.evaluateAst(argAst, state)
      if (value instanceof SimpleRangeValue) {
        numberOfCells += value.fullWidth() * value.fullHeight() - value.numberOfElements()
      }
    }
    return numberOfCells
  }
}
