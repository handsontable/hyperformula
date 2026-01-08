/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {EmptyValue, EmptyValueType} from '../interpreter/InterpreterValue'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex {
  public _graphId?: number

  constructor() {}

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
