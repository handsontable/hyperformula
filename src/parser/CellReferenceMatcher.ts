/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ABSOLUTE_OPERATOR, CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN} from './parser-consts'

/**
 * TBP
 */
export class CellReferenceMatcher {
  readonly POSSIBLE_START_CHARACTERS = [
    ABSOLUTE_OPERATOR,
    "'",
    '_',
    ...Array.from(Array(26)).map((_, i) => i + 'A'.charCodeAt(0)).map(code => String.fromCharCode(code)),
    ...Array.from(Array(26)).map((_, i) => i + 'a'.charCodeAt(0)).map(code => String.fromCharCode(code)),
    ...Array.from(Array(10)).map((_, i) => i).map(code => String.fromCharCode(code)),
    ...Array.from(Array(0x02AF-0x00C0+1)).map((_, i) => i + 0x00C0).map(code => String.fromCharCode(code)),
  ]
  private cellReferenceRegexp = new RegExp(CELL_REFERENCE_WITH_NEXT_CHARACTER_PATTERN, 'y')

  /**
   * TBP
   */
  match(text: string, startOffset: number): RegExpExecArray | null {
    // using 'y' sticky flag (Note it is not supported on IE11...)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
    this.cellReferenceRegexp.lastIndex = startOffset

    const execResult = this.cellReferenceRegexp.exec(text+'@')

    if (execResult == null || execResult[1] == null) {
      return null
    }

    execResult[0] = execResult[1]
    return execResult
  }
}
