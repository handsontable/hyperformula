/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellVertex} from './CellVertex'
import {EmptyValue, EmptyValueType} from '../interpreter/InterpreterValue'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex extends CellVertex {
  constructor() {
    super()
  }

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
