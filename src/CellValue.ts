/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from './Cell'

export type NoErrorCellValue = number | string | boolean | null
export type CellValue = NoErrorCellValue | DetailedCellError

export class DetailedCellError {
  public readonly type: ErrorType
  public readonly message: string

  constructor(
    error: CellError,
    public readonly value: string,
    public readonly address?: string,
  ) {
    this.type = error.type
    this.message = error.message ?? ''
  }

  public toString(): string {
    return this.value
  }

  public valueOf(): string {
    return this.value
  }
}
