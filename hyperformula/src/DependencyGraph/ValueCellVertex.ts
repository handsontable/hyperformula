/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {ExtendedNumber} from '../interpreter/InterpreterValue'
import {CellVertex} from './CellVertex'

export type ValueCellVertexValue = ExtendedNumber | boolean | string | CellError

export interface RawAndParsedValue {
  parsedValue: ValueCellVertexValue,
  rawValue: RawCellContent,
}

/**
 * Represents vertex which keeps static cell value
 */
export class ValueCellVertex extends CellVertex {
  /** Static cell value. */
  constructor(private parsedValue: ValueCellVertexValue, private rawValue: RawCellContent) {
    super()
  }

  public getValues(): RawAndParsedValue {
    return {parsedValue: this.parsedValue, rawValue: this.rawValue}
  }

  public setValues(values: RawAndParsedValue) {
    this.parsedValue = values.parsedValue
    this.rawValue = values.rawValue
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue(): ValueCellVertexValue {
    return this.parsedValue
  }
}
