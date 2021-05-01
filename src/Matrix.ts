/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, SimpleCellAddress, simpleCellAddress} from './Cell'
import {InternalScalarValue} from './interpreter/InterpreterValue'
import {MatrixSize} from './MatrixSize'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'

export interface IMatrix {
  size: MatrixSize,

  width(): number,

  height(): number,

  get(col: number, row: number): InternalScalarValue,

  simpleRangeValue(): SimpleRangeValue | CellError,
}

export class NotComputedMatrix implements IMatrix {
  constructor(public readonly size: MatrixSize) {
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(col: number, row: number): number {
    throw Error('Matrix not computed yet.')
  }

  simpleRangeValue(): SimpleRangeValue {
    throw Error('Matrix not computed yet.')
  }
}

export class Matrix implements IMatrix {
  public size: MatrixSize
  private readonly matrix: InternalScalarValue[][]

  constructor(matrix: InternalScalarValue[][]) {
    this.size = new MatrixSize(matrix.length > 0 ? matrix[0].length : 0, matrix.length)
    this.matrix = matrix
  }

  simpleRangeValue(): SimpleRangeValue {
    return SimpleRangeValue.onlyValues(this.matrix)
  }

  public addRows(aboveRow: number, numberOfRows: number) {
    this.matrix.splice(aboveRow, 0, ...this.zeroArrays(numberOfRows, this.width()))
    this.size.height += numberOfRows
  }

  public addColumns(aboveColumn: number, numberOfColumns: number) {
    for (let i = 0; i < this.height(); i++) {
      this.matrix[i].splice(aboveColumn, 0, ...new Array(numberOfColumns).fill(0))
    }
    this.size.width += numberOfColumns
  }

  public removeRows(startRow: number, endRow: number) {
    if (this.outOfBound(0, startRow) || this.outOfBound(0, endRow)) {
      throw Error('Matrix index out of bound')
    }
    const numberOfRows = endRow - startRow + 1
    this.matrix.splice(startRow, numberOfRows)
    this.size.height -= numberOfRows
  }

  public removeColumns(leftmostColumn: number, rightmostColumn: number) {
    if (this.outOfBound(leftmostColumn, 0) || this.outOfBound(rightmostColumn, 0)) {
      throw Error('Matrix index out of bound')
    }
    const numberOfColumns = rightmostColumn - leftmostColumn + 1
    for (const row of this.matrix) {
      row.splice(leftmostColumn, numberOfColumns)
    }
    this.size.width -= numberOfColumns
  }

  public zeroArrays(count: number, size: number) {
    const result = []
    for (let i = 0; i < count; ++i) {
      result.push(new Array(size).fill(0))
    }
    return result
  }

  public get(col: number, row: number): InternalScalarValue {
    if (this.outOfBound(col, row)) {
      throw Error('Matrix index out of bound')
    }
    return this.matrix[row][col]
  }

  public set(col: number, row: number, value: number): void {
    if (this.outOfBound(col, row)) {
      throw Error('Matrix index out of bound')
    }
    this.matrix[row][col] = value
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  public raw(): InternalScalarValue[][] {
    return this.matrix
  }

  private outOfBound(col: number, row: number): boolean {
    return col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1
  }
}

export class ErroredMatrix implements IMatrix {
  constructor(
    private readonly error: CellError,
    public readonly size: MatrixSize,
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
