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

  /**
   * What produced this error: the function or operator that rejected a value, e.g. `'SQRT'`
   * or `'divide'`. An operator is named after the arithmetic helper it dispatches to.
   *
   * First occurrence wins, so a function that only received the error from a nested call
   * never replaces it: `=SUM(SQRT(-1))` reports `'SQRT'`. An error read from another cell
   * keeps the origin it had there.
   *
   * `undefined` when no function or operator produced the error, e.g. for `#SPILL!`,
   * `#CYCLE!`, a parsing error, or an error value typed into a cell. An error from a
   * reference the engine cannot resolve is attributed to the function that reads it.
   */
  public readonly originFunction?: string

  /**
   * The zero-based index of the argument that was rejected, when `originFunction` names a
   * function whose own argument coercion produced this error.
   *
   * The index counts the arguments AS WRITTEN in the formula. For a function that accepts
   * ranges, a range is one argument however many cells it covers, so `=AND(A1:A100,"x")`
   * reports `1` for `"x"` — the index describes the formula, not the data behind it.
   *
   * `undefined` whenever the error was not a coercion failure on one of the origin
   * function's own arguments — including when it came from a nested call (its own
   * `originFunction` already claimed it), when it was propagated from elsewhere, or when
   * the offending value sat inside a range that the function IGNORES
   * (`=AND(A1:A2,TRUE())` over text returns `TRUE`, so there is no error to attribute).
   *
   * When a function does NOT ignore it — `MULTINOMIAL` coerces every value to a number —
   * a bad cell inside a range is attributed to the RANGE's own argument slot, since that
   * is the argument the user wrote: `=MULTINOMIAL(1,A1:A3)` with text in `A3` reports `1`.
   * The index names the argument to look at, not the cell; the address of the offending
   * cell is not part of this field.
   *
   * Two cases report an index that is less useful than it looks: an argument that is a
   * reference the engine cannot resolve is claimed by the function reading it
   * (`=DATE(2020,A99999999999,1)` reports `DATE` with index `1`), and an error raised per
   * element while a function is applied across an array carries an index with no
   * `originFunction` (`=DATE(2020,A1:A2,1)` over text, with array arithmetic on).
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
