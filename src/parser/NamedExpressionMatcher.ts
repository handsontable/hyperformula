/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {ALL_UNICODE_LETTERS_ARRAY, NAMED_EXPRESSION_PATTERN, R1C1_CELL_REFERENCE_PATTERN} from './parser-consts'

/**
 * Helper class for recognizing NamedExpression token in text
 */
export class NamedExpressionMatcher {
  readonly POSSIBLE_START_CHARACTERS = [ ...ALL_UNICODE_LETTERS_ARRAY, '_' ]
  private namedExpressionRegexp = new RegExp(NAMED_EXPRESSION_PATTERN, 'y')
  private r1c1CellRefRegexp = new RegExp(`^${R1C1_CELL_REFERENCE_PATTERN}$`)

  /**
   * Method used by the lexer to recognize NamedExpression token in text
   *
   * Note: using 'y' sticky flag for a named expression which is not supported on IE11...
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
   */
  match(text: string, startOffset: number): RegExpExecArray | null {
    this.namedExpressionRegexp.lastIndex = startOffset
    const execResult = this.namedExpressionRegexp.exec(text)

    if (execResult == null || execResult[0] == null) {
      return null
    }

    if (this.r1c1CellRefRegexp.test(execResult[0])) {
      return null
    }

    return execResult
  }
}
