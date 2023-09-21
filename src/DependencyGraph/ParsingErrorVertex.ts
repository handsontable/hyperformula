/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {CellError} from '../Cell'
import {ParsingError} from '../parser/Ast'

export class ParsingErrorVertex {
  constructor(
    public readonly errors: ParsingError[],
    public readonly rawInput: string
  ) {
  }

  public getCellValue(): CellError {
    const firstNonemptyMessage = this.errors.map(error => error.message).find((msg) => msg)
    return CellError.parsingError(firstNonemptyMessage)
  }

  public getFormula(): string {
    return this.rawInput
  }
}
