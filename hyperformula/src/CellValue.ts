/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from './Cell'

export type NoErrorCellValue = number | string | boolean | null
export type CellValue = NoErrorCellValue | DetailedCellError

export class DetailedCellError {
  public readonly type: ErrorType
  public readonly message: string

  /**
   * Whether the underlying error carried a message at all.
   *
   * `message` collapses "no message" and "an empty message" into `''`; this flag
   * keeps them apart for consumers that need to know whether a cause was stated.
   * Errors the engine raises while evaluating a formula always carry a message. A
   * `false` here means nobody stated a cause: a custom function that did not supply
   * one, or an error value a user typed straight into a cell, where the cause is the
   * typing itself and `originFunction` says so.
   */
  public readonly hasMessage: boolean

  constructor(
    error: CellError,
    public readonly value: string,
    public readonly address?: string,
  ) {
    this.type = error.type
    this.message = error.message ?? ''
    this.hasMessage = error.message !== undefined
  }

  public toString(): string {
    return this.value
  }

  public valueOf(): string {
    return this.value
  }
}
