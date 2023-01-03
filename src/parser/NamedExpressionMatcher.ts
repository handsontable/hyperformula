/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {NAMED_EXPRESSION_PATTERN} from './parser-consts'

/**
 * Helper class for recognizing NamedExpression token in the text
 */
export class NamedExpressionMatcher {
  readonly POSSIBLE_START_CHARACTERS = [
    '_',
    ...Array.from(Array(26)).map((_, i) => i + 'A'.charCodeAt(0)).map(code => String.fromCharCode(code)),
    ...Array.from(Array(26)).map((_, i) => i + 'a'.charCodeAt(0)).map(code => String.fromCharCode(code)),
    ...Array.from(Array(0x02AF-0x00C0+1)).map((_, i) => i + 0x00C0).map(code => String.fromCharCode(code)),
  ]
  private namedExpressionRegexp = new RegExp(NAMED_EXPRESSION_PATTERN, 'y')

  /**
   * Method used by the lexer to recognize NamedExpression token in the text
   */
  match(text: string, startOffset: number): RegExpExecArray | null {
    // using 'y' sticky flag (Note it is not supported on IE11...)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
    this.namedExpressionRegexp.lastIndex = startOffset

    const execResult = this.namedExpressionRegexp.exec(text)

    if (execResult == null || execResult[0] == null) {
      return null
    }

    if (/^[rR][0-9]*[cC][0-9]*$/.test(execResult[0])) {
      return null
    }

    return execResult
  }
}
