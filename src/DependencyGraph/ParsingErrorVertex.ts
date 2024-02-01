/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {ParsingError} from '../parser/Ast'

/**
 * Represents a cell that contains a parsing error.
 */
export class ParsingErrorVertex {
  /**
   * Constructor
   */
  constructor(
    public readonly errors: ParsingError[],
    public readonly rawInput: string
  ) {
  }

  /**
   * Returns the value of the cell.
   */
  public getCellValue(): CellError {
    const firstNonemptyMessage = this.errors.map(error => error.message).find((msg) => msg)
    return CellError.parsingError(firstNonemptyMessage)
  }

  /**
   * Returns the formula of the cell.
   */
  public getFormula(): string {
    return this.rawInput
  }
}
