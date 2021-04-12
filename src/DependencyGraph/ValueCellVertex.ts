/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {ExtendedNumber, RawScalarValue} from '../interpreter/InterpreterValue'

export type ValueCellVertexValue = ExtendedNumber | boolean | string | CellError

export interface RawAndParsedValue {
  parsedValue: ValueCellVertexValue,
  rawValue: RawCellContent,
}

/**
 * Represents vertex which keeps static cell value
 */
export class ValueCellVertex {
  /** Static cell value. */
  constructor(private parsedValue: ValueCellVertexValue, private rawValue: RawCellContent) {
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

  public setCellValue(_cellValue: ValueCellVertexValue): never {
    throw 'SetCellValue is deprecated for ValueCellVertex'
  }
}
