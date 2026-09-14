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
   * Errors produced by HyperFormula itself always carry one — a `false` here
   * means the error came from a custom function that did not supply a message.
   */
  public readonly hasMessage: boolean

  /**
   * What produced this error.
   *
   * Usually the function or operator that rejected a value, e.g. `'SUM'` or `'divide'`.
   * Errors that exist before any function reads them name what built them instead:
   * `'reference'` for a reference that cannot be resolved, `'removed reference'` for one
   * destroyed by removing rows or columns, `'parser'` for a formula that could not be
   * parsed, `'user input'` for an error value typed into a cell, and `'literal'` for one
   * written into a formula.
   *
   * First occurrence wins, so a function that only read the error never replaces that:
   * `=SUM(SQRT(-1))` reports `'SQRT'`, and `=SUM(A2:A99999999999)` reports `'reference'`.
   *
   * `undefined` when nothing produced the error in this sense — `#SPILL!` and `#CYCLE!`
   * arise from the layout of a sheet rather than from evaluating a value. It is also
   * `undefined`, and the reading function's name may appear instead, for an error that
   * arises inside an array result; see the known limitations.
   */
  public readonly originFunction?: string

  /**
   * The zero-based index of the argument that was rejected, when `originFunction` names a
   * function whose own argument coercion produced this error.
   *
   * `undefined` whenever the error was not a coercion failure on one of the origin
   * function's own arguments — including when it came from a nested call (its own
   * `originFunction` already claimed it), when it was propagated from elsewhere, or when
   * the argument was a reference that could not be resolved, which the reference itself
   * reports. An error raised per element while a function is applied across an array is
   * the one case where an index can appear without an `originFunction`; see the known
   * limitations.
   */
  public readonly argumentIndex?: number

  constructor(
    error: CellError,
    public readonly value: string,
    public readonly address?: string,
  ) {
    this.type = error.type
    this.message = error.message ?? ''
    this.hasMessage = error.message !== undefined
    this.originFunction = error.originFunction
    this.argumentIndex = error.argumentIndex
  }

  public toString(): string {
    return this.value
  }

  public valueOf(): string {
    return this.value
  }
}
