/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ArraySize} from './ArraySize'
import {CellError} from './Cell'
import {EmptyValue, InternalScalarValue, InterpreterValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'

export interface IArray {
  size: ArraySize,

  width(): number,

  height(): number,

  get(col: number, row: number): InternalScalarValue,

  simpleRangeValue(): SimpleRangeValue | CellError,
}

export class NotComputedArray implements IArray {
  constructor(public readonly size: ArraySize) {
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(col: number, row: number): number {
    throw Error('Array not computed yet.')
  }

  simpleRangeValue(): SimpleRangeValue {
    throw Error('Array not computed yet.')
  }
}

export class ArrayValue implements IArray {
  public size: ArraySize
  private readonly array: InternalScalarValue[][]

  constructor(array: InternalScalarValue[][]) {
    this.size = new ArraySize(array.length > 0 ? array[0].length : 0, array.length)
    this.array = array
  }

  static fromInterpreterValue(value: InterpreterValue) {
    if (value instanceof SimpleRangeValue) {
      return new ArrayValue(value.data)
    } else {
      return new ArrayValue([[value]])
    }
  }

  simpleRangeValue(): SimpleRangeValue {
    return SimpleRangeValue.onlyValues(this.array)
  }

  public addRows(aboveRow: number, numberOfRows: number) {
    this.array.splice(aboveRow, 0, ...this.nullArrays(numberOfRows, this.width()))
    this.size.height += numberOfRows
  }

  public addColumns(aboveColumn: number, numberOfColumns: number) {
    for (let i = 0; i < this.height(); i++) {
      this.array[i].splice(aboveColumn, 0, ...new Array(numberOfColumns).fill(EmptyValue))
    }
    this.size.width += numberOfColumns
  }

  public removeRows(startRow: number, endRow: number) {
    if (this.outOfBound(0, startRow) || this.outOfBound(0, endRow)) {
      throw Error('Array index out of bound')
    }
    const numberOfRows = endRow - startRow + 1
    this.array.splice(startRow, numberOfRows)
    this.size.height -= numberOfRows
  }

  public removeColumns(leftmostColumn: number, rightmostColumn: number) {
    if (this.outOfBound(leftmostColumn, 0) || this.outOfBound(rightmostColumn, 0)) {
      throw Error('Array index out of bound')
    }
    const numberOfColumns = rightmostColumn - leftmostColumn + 1
    for (const row of this.array) {
      row.splice(leftmostColumn, numberOfColumns)
    }
    this.size.width -= numberOfColumns
  }

  public nullArrays(count: number, size: number) {
    const result = []
    for (let i = 0; i < count; ++i) {
      result.push(new Array(size).fill(EmptyValue))
    }
    return result
  }

  public get(col: number, row: number): InternalScalarValue {
    if (this.outOfBound(col, row)) {
      throw Error('Array index out of bound')
    }
    return this.array[row][col]
  }

  public set(col: number, row: number, value: number): void {
    if (this.outOfBound(col, row)) {
      throw Error('Array index out of bound')
    }
    this.array[row][col] = value
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  public raw(): InternalScalarValue[][] {
    return this.array
  }

  public resize(newSize: ArraySize) {
    if (this.height() < newSize.height && isFinite(newSize.height)) {
      this.addRows(this.height(), newSize.height - this.height())
    }
    if (this.height() > newSize.height) {
      throw 'Resizing to smaller array'
    }
    if (this.width() < newSize.width && isFinite(newSize.width)) {
      this.addColumns(this.width(), newSize.width - this.width())
    }
    if (this.width() > newSize.width) {
      throw 'Resizing to smaller array'
    }
  }

  private outOfBound(col: number, row: number): boolean {
    return col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1
  }
}

export class ErroredArray implements IArray {
  constructor(
    private readonly error: CellError,
    public readonly size: ArraySize,
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(col: number, row: number): CellError {
    return this.error
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  simpleRangeValue(): CellError {
    return this.error
  }
}
