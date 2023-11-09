/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {EmptyValue, EmptyValueType} from '../interpreter/InterpreterValue'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex {
  constructor() {}

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
