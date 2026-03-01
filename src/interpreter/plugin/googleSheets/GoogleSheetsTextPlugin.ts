/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../../ArraySize'
import {CellError, ErrorType} from '../../../Cell'
import {ErrorMessage} from '../../../error-message'
import {AstNodeType, ProcedureAst} from '../../../parser'
import {InterpreterState} from '../../InterpreterState'
import {InterpreterValue} from '../../InterpreterValue'
import {SimpleRangeValue} from '../../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from '../FunctionPlugin'

/**
 * Google Sheets-compatible text function overrides.
 *
 * Overrides SPLIT to use Google Sheets signature:
 * SPLIT(text, delimiter, [split_by_each], [remove_empty_text])
 */
export class GoogleSheetsTextPlugin extends FunctionPlugin implements FunctionPluginTypecheck<GoogleSheetsTextPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'SPLIT': {
      method: 'split',
      sizeOfResultArrayMethod: 'splitArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: true},
      ],
      vectorizationForbidden: true,
    },
  }

  /**
   * SPLIT(text, delimiter, [split_by_each], [remove_empty_text])
   *
   * Splits text by delimiter and returns a horizontal array.
   */
  public split(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SPLIT'),
      (text: string, delimiter: string, splitByEach: boolean, removeEmptyText: boolean) => {
        if (delimiter === '') {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
        }

        let parts: string[]

        if (splitByEach) {
          const escapedChars = delimiter.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          const regex = new RegExp(escapedChars.join('|'))
          parts = text.split(regex)
        } else {
          parts = text.split(delimiter)
        }

        if (removeEmptyText) {
          parts = parts.filter(p => p !== '')
        }

        if (parts.length === 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
        }

        return SimpleRangeValue.onlyValues([parts])
      }
    )
  }

  /**
   * Predicts the array size for SPLIT results.
   *
   * For string literal arguments, the maximum number of parts is text.length + 1
   * (splitting every character). For non-literal arguments (cell references),
   * falls back to maxColumns as the only safe upper bound — HF's resize()
   * throws if actual > predicted, so under-prediction causes a runtime error.
   * Over-prediction pads with EmptyValue and may cause #SPILL! errors if
   * neighboring cells are occupied.
   */
  public splitArraySize(ast: ProcedureAst, _state: InterpreterState): ArraySize {
    if (ast.args.length < 1) {
      return ArraySize.error()
    }

    const textArg = ast.args[0]
    // When the text argument is a cell reference (not a literal), use a
    // minimal non-scalar fallback. ArrayValue.resize() will grow to the
    // actual computed size and tolerates actual > predicted.
    const width = (textArg.type === AstNodeType.STRING)
      ? textArg.value.length + 1
      : 2

    return new ArraySize(width, 1)
  }
}
