/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex} from './DependencyGraph'
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

  /* Wrong address reference. */
  REF = 'REF',

  /* Generic error */
  ERROR = 'ERROR'
}

export const EmptyValue = Symbol()
export type EmptyValueType = typeof EmptyValue
export type NoErrorCellValue = number | string | boolean | EmptyValueType
export type InternalCellValue = NoErrorCellValue | CellError

export enum CellType {
  FORMULA = 'FORMULA',
  VALUE = 'VALUE',
  MATRIX = 'MATRIX',
  EMPTY = 'EMPTY',
}

export const getCellType = (vertex: CellVertex | null): CellType => {
  if (vertex instanceof FormulaCellVertex) {
    return CellType.FORMULA
  }
  if (vertex instanceof ValueCellVertex
      || (vertex instanceof MatrixVertex && vertex.isNumeric())) {
    return CellType.VALUE
  }
  if (vertex instanceof MatrixVertex && vertex.isFormula()) {
    return CellType.MATRIX
  }

  return CellType.EMPTY
}

export enum CellValueType {
  EMPTY = 'EMPTY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  ERROR = 'ERROR',
}

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
}

export const getCellValueType = (cellValue: InternalCellValue): CellValueType => {
  if (cellValue === EmptyValue) {
    return CellValueType.EMPTY
  }

  if (cellValue instanceof CellError) {
    return CellValueType.ERROR
  }

  switch (typeof cellValue) {
    case 'string':
      return CellValueType.STRING
    case 'number':
      return CellValueType.NUMBER
    case 'boolean':
      return CellValueType.BOOLEAN
  }

  throw new Error('Cell value not computed')
}

export class CellError {
  constructor(
    public readonly type: ErrorType,
    public readonly message?: string,
  ) {
  }

  public static parsingError() {
    return new CellError(ErrorType.ERROR, 'Parsing error')
  }
}

export interface SimpleRowAddress {
  row: number,
  sheet: number,
}

export const simpleRowAddress = (sheet: number, row: number): SimpleRowAddress => ({sheet, row})

export interface SimpleColumnAddress {
  col: number,
  sheet: number,
}

export const simpleColumnAddress = (sheet: number, col: number): SimpleColumnAddress => ({sheet, col})

export interface SimpleCellAddress {
  col: number,
  row: number,
  sheet: number,
}

export const simpleCellAddress = (sheet: number, col: number, row: number): SimpleCellAddress => ({sheet, col, row})
export const invalidSimpleCellAddress = (address: SimpleCellAddress): boolean => (address.col < 0 || address.row < 0)
export const movedSimpleCellAddress = (address: SimpleCellAddress, toSheet: number, toRight: number, toBottom: number): SimpleCellAddress => {
  return simpleCellAddress(toSheet, address.col + toRight, address.row + toBottom)
}

export const absoluteSheetReference = (address: AddressWithSheet, baseAddress: SimpleCellAddress): number => {
  return address.sheet === null ? baseAddress.sheet : address.sheet
}

export interface SheetCellAddress {
  col: number,
  row: number,
}

export interface CellRange {
  start: CellAddress,
  end: CellAddress,
}
