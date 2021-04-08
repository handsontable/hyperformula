/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {ExtendedNumber, RawScalarValue} from '../interpreter/InterpreterValue'

export type ValueCellVertexValue = ExtendedNumber | boolean | string | CellError

/**
 * Represents vertex which keeps static cell value
 */
export class ValueCellVertex {
  /** Static cell value. */
  constructor(private cellValue: ValueCellVertexValue, private rawValue: RawCellContent) {
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue(): ValueCellVertexValue {
    return this.cellValue
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public setCellValue(cellValue: ValueCellVertexValue) {
    this.cellValue = cellValue
  }

  public getRawValue(): RawCellContent {
    return this.rawValue
  }

  public setRawValue(rawValue: RawCellContent) {
    this.rawValue = rawValue
  }
}
