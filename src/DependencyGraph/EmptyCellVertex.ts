/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {EmptyValue, EmptyValueType, SimpleCellAddress} from '../Cell'

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex {
  constructor(
    public address: SimpleCellAddress //might be outdated!
  ) {
  }
  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue(): EmptyValueType {
    return EmptyValue
  }
}
