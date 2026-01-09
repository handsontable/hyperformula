/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {InterpreterValue} from '../interpreter/InterpreterValue'
import {Vertex} from './Vertex'

/**
 * Represents vertex which keeps values of one or more cells
 */
export abstract class CellVertex extends Vertex {
  public abstract getCellValue(): InterpreterValue

  constructor() {
    super()
  }
}
