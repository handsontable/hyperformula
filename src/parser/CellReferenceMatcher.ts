/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {
  ABSOLUTE_OPERATOR, ALL_UNICODE_LETTERS_ARRAY,
  CELL_REFERENCE_PATTERN,
  NON_RESERVED_CHARACTER_PATTERN
} from './parser-consts'

const CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN = `(${CELL_REFERENCE_PATTERN})[^${NON_RESERVED_CHARACTER_PATTERN}]`

/**
 * Helper class for recognizing CellReference token in text
 */
export class CellReferenceMatcher {
  readonly POSSIBLE_START_CHARACTERS = [ ...ALL_UNICODE_LETTERS_ARRAY, ABSOLUTE_OPERATOR, "'", '_', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ]
  private cellReferenceRegexp = new RegExp(CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN, 'y')

  /**
   * Method used by the lexer to recognize CellReference token in text
   *
   * Note: using 'y' sticky flag for a named expression which is not supported on IE11...
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
   */
  match(text: string, startOffset: number): RegExpExecArray | null {
    this.cellReferenceRegexp.lastIndex = startOffset

    const execResult = this.cellReferenceRegexp.exec(text+'@')

    if (execResult == null || execResult[1] == null) {
      return null
    }

    execResult[0] = execResult[1]
    return execResult
  }
}
