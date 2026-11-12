/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {ErrorOrigin} from '../error-message'
import {ParsingError} from '../parser/Ast'
import {CellVertex} from './CellVertex'

/**
 * Represents a cell that contains a parsing error.
 */
export class ParsingErrorVertex extends CellVertex {
  /**
   * Constructor
   */
  constructor(
    public readonly errors: ParsingError[],
    public readonly rawInput: string
  ) {
    super()
  }

  /**
   * Returns the value of the cell.
   */
  public getCellValue(): CellError {
    const firstNonemptyMessage = this.errors.map(error => error.message).find((msg) => msg)
    return CellError.parsingError(firstNonemptyMessage).withOrigin(ErrorOrigin.Parser)
  }

  /**
   * Returns the formula of the cell.
   */
  public getFormula(): string {
    return this.rawInput
  }
}
