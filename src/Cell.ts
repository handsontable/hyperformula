/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArrayFormulaVertex, CellVertex, ScalarFormulaVertex, ParsingErrorVertex, ValueCellVertex} from './DependencyGraph'
import {FormulaVertex} from './DependencyGraph/FormulaVertex'
import {ErrorMessage} from './error-message'
import {
  EmptyValue,
  getFormatOfExtendedNumber,
  getTypeOfExtendedNumber,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import {Maybe} from './Maybe'
import {CellAddress} from './parser'
import {AddressWithSheet} from './parser/Address'

/**
 * Possible errors returned by our interpreter.
 */
export enum ErrorType {
  /** Division by zero. */
  DIV_BY_ZERO = 'DIV_BY_ZERO',

  /** Unknown function name. */
  NAME = 'NAME',
  VALUE = 'VALUE',
  NUM = 'NUM',
  NA = 'NA',

  /** Cyclic dependency. */
  CYCLE = 'CYCLE',

  /** Wrong address reference. */
  REF = 'REF',

  /** Array spill error. */
  SPILL = 'SPILL',

  /** Invalid/missing licence error. */
  LIC = 'LIC',

  /** Generic error */
  ERROR = 'ERROR'
}

export type TranslatableErrorType = Exclude<ErrorType, ErrorType.LIC>

export enum CellType {
  FORMULA = 'FORMULA',
  VALUE = 'VALUE',
  ARRAY = 'ARRAY',
  EMPTY = 'EMPTY',
  ARRAYFORMULA = 'ARRAYFORMULA',
}

export const getCellType = (vertex: Maybe<CellVertex>, address: SimpleCellAddress): CellType => {
  if (vertex instanceof ArrayFormulaVertex) {
    if (vertex.isLeftCorner(address)) {
      return CellType.ARRAYFORMULA
    } else {
      return CellType.ARRAY
    }
  }
  if (vertex instanceof ScalarFormulaVertex || vertex instanceof ParsingErrorVertex) {
    return CellType.FORMULA
  }
  if (vertex instanceof ValueCellVertex) {
    return CellType.VALUE
  }

  return CellType.EMPTY
}

export enum CellValueNoNumber {
  EMPTY = 'EMPTY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  ERROR = 'ERROR',
}

export enum CellValueJustNumber {
  NUMBER = 'NUMBER'
}

export type CellValueType = CellValueNoNumber | CellValueJustNumber
export const CellValueType = {...CellValueNoNumber, ...CellValueJustNumber}

export type CellValueDetailedType = CellValueNoNumber | NumberType
export const CellValueDetailedType = {...CellValueNoNumber, ...NumberType}

export const CellValueTypeOrd = (arg: CellValueType): number => {
  switch (arg) {
    case CellValueType.EMPTY:
      return 0
    case CellValueType.NUMBER:
      return 1
    case CellValueType.STRING:
      return 2
    case CellValueType.BOOLEAN:
      return 3
    case CellValueType.ERROR:
      return 4
  }
  throw new Error('Cell value not computed')
}

export const getCellValueType = (cellValue: InterpreterValue): CellValueType => {
  if (cellValue === EmptyValue) {
    return CellValueType.EMPTY
  }

  if (cellValue instanceof CellError || cellValue instanceof SimpleRangeValue) {
    return CellValueType.ERROR
  }

  if (typeof cellValue === 'string') {
    return CellValueType.STRING
  } else if (isExtendedNumber(cellValue)) {
    return CellValueType.NUMBER
  } else if (typeof cellValue === 'boolean') {
    return CellValueType.BOOLEAN
  }

  throw new Error('Cell value not computed')
}

export const getCellValueDetailedType = (cellValue: InterpreterValue): CellValueDetailedType => {
  if (isExtendedNumber(cellValue)) {
    return getTypeOfExtendedNumber(cellValue)
  } else {
    return getCellValueType(cellValue) as CellValueDetailedType
  }
}

export const getCellValueFormat = (cellValue: InterpreterValue): string | undefined => {
  if (isExtendedNumber(cellValue)) {
    return getFormatOfExtendedNumber(cellValue)
  } else {
    return undefined
  }
}

export class CellError {
  constructor(
    public readonly type: ErrorType,
    public readonly message?: string,
    public readonly root?: FormulaVertex,
    public readonly originFunction?: string,
    public readonly argumentIndex?: number,
    public readonly propagated: boolean = false,
    public readonly originAddress?: SimpleCellAddress,
  ) {
  }

  /**
   * Names the function or operator that produced this error.
   *
   * First occurrence wins, so an outer function that merely received the error back does not
   * claim it: `=SUM(SQRT(-1))` keeps `SQRT`. A propagated error — one read out of another cell
   * rather than produced here — can never acquire an origin it did not already have.
   *
   * @param {string} functionName - the function or operator helper that produced the error
   */
  public withOrigin(functionName: string): CellError {
    if (this.propagated || this.originFunction !== undefined) {
      return this
    }
    return new CellError(this.type, this.message, this.root, functionName, this.argumentIndex, this.propagated, this.originAddress)
  }

  /**
   * Records which argument of the origin function was rejected. First occurrence wins, and a
   * propagated error never acquires one: the reading function's own argument slot is not the
   * offending argument.
   *
   * Also a no-op once `originFunction` is set, even for a non-propagated error: a nested call's
   * own error (e.g. `SQRT(-1)` inside `=DATE(1,1,SQRT(-1))`) stamps its origin before the outer
   * call's coercion loop ever sees it, and that loop's own argument slot is not the one that
   * actually produced the error — attaching an index here would pair someone else's origin with
   * this call's argument position, which is incoherent.
   *
   * @param {number} index - zero-based index of the offending argument
   */
  public withArgumentIndex(index: number): CellError {
    if (this.propagated || this.originFunction !== undefined || this.argumentIndex !== undefined) {
      return this
    }
    return new CellError(this.type, this.message, this.root, this.originFunction, index, this.propagated, this.originAddress)
  }

  /**
   * Marks this error as read from another cell rather than produced by the current evaluation.
   *
   * This is what stops a cell from adopting an error it only read: {@link attachRootVertex} skips
   * a propagated error, so the reported address stays the one where the error actually appeared.
   */
  public asPropagated(): CellError {
    if (this.propagated) {
      return this
    }
    return new CellError(this.type, this.message, this.root, this.originFunction, this.argumentIndex, true, this.originAddress)
  }

  /**
   * Records the address an otherwise rootless error appeared at.
   *
   * For vertices that hold a static error rather than computing one (a parse error, or an error
   * value the user typed), there is no `FormulaVertex` to serve as a lazily-resolved `root`. This
   * cannot go stale: `CellError` is immutable, so the stored value is never stamped — every read
   * stamps a fresh copy with the address current at that moment, which is what keeps it correct
   * across row and column changes.
   *
   * @param {SimpleCellAddress} address - the address the error was read from
   */
  public withOriginAddress(address: SimpleCellAddress): CellError {
    if (this.originAddress !== undefined) {
      return this
    }
    return new CellError(this.type, this.message, this.root, this.originFunction, this.argumentIndex, this.propagated, address)
  }

  /**
   * Returns a CellError with a given message.
   * @param {string} detailedMessage - message to be displayed
   */
  public static parsingError(detailedMessage?: string): CellError {
    return new CellError(ErrorType.ERROR, `${ErrorMessage.ParseError}${detailedMessage ? ' ' + detailedMessage : ''}`)
  }

  public attachRootVertex(vertex: FormulaVertex): CellError {
    if (this.root === undefined) {
      return new CellError(this.type, this.message, vertex, this.originFunction, this.argumentIndex, this.propagated, this.originAddress)
    } else {
      return this
    }
  }
}

export interface SimpleRowAddress {
  row: number,
  sheet: number,
}

export const simpleRowAddress = (sheet: number, row: number): SimpleRowAddress => ({sheet, row})

export const invalidSimpleRowAddress = (address: SimpleRowAddress): boolean => (address.row < 0)

export interface SimpleColumnAddress {
  col: number,
  sheet: number,
}

export const simpleColumnAddress = (sheet: number, col: number): SimpleColumnAddress => ({sheet, col})

export const invalidSimpleColumnAddress = (address: SimpleColumnAddress): boolean => (address.col < 0)

export interface SimpleCellAddress {
  col: number,
  row: number,
  sheet: number,
}

export const simpleCellAddress = (sheet: number, col: number, row: number): SimpleCellAddress => ({sheet, col, row})

/**
 * Checks if the column or row id is negative.
 */
export const isColOrRowInvalid = (address: SimpleCellAddress): boolean => (address.col < 0 || address.row < 0)

export const movedSimpleCellAddress = (address: SimpleCellAddress, toSheet: number, toRight: number, toBottom: number): SimpleCellAddress => {
  return simpleCellAddress(toSheet, address.col + toRight, address.row + toBottom)
}

export const addressKey = (address: SimpleCellAddress) => `${address.sheet},${address.row},${address.col}`

/**
 * Checks if the object is a simple cell address.
 */
export function isSimpleCellAddress(obj: unknown): obj is SimpleCellAddress {
  return obj
    && (typeof obj === 'object' || typeof obj === 'function')
    && typeof (obj as SimpleCellAddress)?.sheet === 'number'
    && typeof (obj as SimpleCellAddress)?.col === 'number'
    && typeof (obj as SimpleCellAddress)?.row === 'number'
}

export const absoluteSheetReference = (address: AddressWithSheet, baseAddress: SimpleCellAddress): number => {
  return address.sheet ?? baseAddress.sheet
}

export const equalSimpleCellAddress = (left: SimpleCellAddress, right: SimpleCellAddress) => {
  return left.sheet === right.sheet && left.col === right.col && left.row === right.row
}

export interface SheetCellAddress {
  col: number,
  row: number,
}

export interface CellRange {
  start: CellAddress,
  end: CellAddress,
}
