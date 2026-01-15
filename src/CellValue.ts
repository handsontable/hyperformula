/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from './Cell'

export type NoErrorCellValue = number | string | boolean | null
export type CellValue = NoErrorCellValue | DetailedCellError

/**
 * Cell value type when precision is preserved.
 * Numeric values are returned as strings to avoid IEEE-754 precision loss.
 */
export type PrecisionCellValue = string | boolean | null | DetailedCellError

/**
 * Options for getCellValue and related methods.
 */
export interface GetCellValueOptions {
  /**
   * If true, numeric values are returned as strings to preserve full precision.
   * This avoids IEEE-754 floating-point precision loss when exporting values.
   * Default: false (returns native JavaScript numbers)
   */
  preservePrecision?: boolean,
}

/**
 *
 */
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

  
  /**
   *
   */
  public toString(): string {
    return this.value
  }

  
  /**
   *
   */
  public valueOf(): string {
    return this.value
  }
}
