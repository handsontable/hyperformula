/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, SimpleCellAddress} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {EmptyValue, getRawValue, InternalScalarValue} from '../interpreter/InterpreterValue'
import {ErroredMatrix, IMatrix, Matrix, NotComputedMatrix} from '../Matrix'
import {MatrixSize} from '../MatrixSize'
import {Maybe} from '../Maybe'
import {Ast} from '../parser'
import {ColumnsSpan, RowsSpan} from '../Span'

export class MatrixVertex {
  get width(): number {
    return this.matrix.width()
  }

  get height(): number {
    return this.matrix.height()
  }

  get sheet(): number {
    return this.cellAddress.sheet
  }
  public static fromRange(range: AbsoluteCellRange, formula?: Ast): MatrixVertex {
    return new MatrixVertex(range.start, range.width(), range.height(), formula)
  }
  public matrix: IMatrix

  constructor(public cellAddress: SimpleCellAddress, width: number, height: number, private formula?: Ast) {
    this.matrix = new NotComputedMatrix(new MatrixSize(width, height))
  }

  public setCellValue(matrix: Matrix) {
    this.matrix = matrix
  }

  public setErrorValue(error: CellError) {
    this.matrix = new ErroredMatrix(error, this.matrix.size)
  }

  public getCellValue(): Matrix | CellError {
    if (this.matrix instanceof NotComputedMatrix) {
      throw Error('Matrix not computed yet.')
    }
    return this.matrix as (Matrix | CellError)
  }

  public getMatrixCellValue(address: SimpleCellAddress): InternalScalarValue {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row

    return this.matrix.get(col, row)
  }

  public getMatrixCellRawValue(address: SimpleCellAddress): Maybe<RawCellContent> {
    const val = this.getMatrixCellValue(address)
    if(val instanceof CellError || val === EmptyValue) {
      return undefined
    } else {
      return getRawValue(val)
    }
  }

  public setMatrixCellValue(address: SimpleCellAddress, value: number): void {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row
    if (this.matrix instanceof Matrix) {
      this.matrix.set(col, row, value)
    }
  }

  public getRange(): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(this.cellAddress, this.width, this.height)
  }

  public getAddress(): SimpleCellAddress {
    return this.cellAddress
  }

  public setAddress(address: SimpleCellAddress) {
    this.cellAddress = address
  }

  public getFormula(): Maybe<Ast> {
    return this.formula
  }

  public setFormula(newFormula: Ast) {
    this.formula = newFormula
  }

  public isFormula(): boolean {
    return this.formula !== undefined
  }

  public isNumeric(): boolean {
    return this.formula === undefined
  }

  public spansThroughSheetRows(sheet: number, startRow: number, endRow: number = startRow): boolean {
    return (this.cellAddress.sheet === sheet) &&
      (this.cellAddress.row <= endRow) &&
      (startRow < this.cellAddress.row + this.height)
  }

  public spansThroughSheetColumn(sheet: number, col: number, columnEnd: number = col): boolean {
    return (this.cellAddress.sheet === sheet) &&
      (this.cellAddress.col <= columnEnd) &&
      (col < this.cellAddress.col + this.width)
  }

  public addRows(sheet: number, row: number, numberOfRows: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addRows(row - this.getAddress().row, numberOfRows)
    }
  }

  public addColumns(sheet: number, column: number, numberOfColumns: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addColumns(column - this.getAddress().col, numberOfColumns)
    }
  }

  public removeRows(removedRows: RowsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedRowsFromMatrix = this.rowsFromMatrix().intersect(removedRows)!
      this.matrix.removeRows(removedRowsFromMatrix.rowStart - this.getAddress().row, removedRowsFromMatrix.rowEnd - this.getAddress().row)
    }
  }

  public removeColumns(removedColumns: ColumnsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedColumnsFromMatrix = this.columnsFromMatrix().intersect(removedColumns)!
      this.matrix.removeColumns(removedColumnsFromMatrix.columnStart - this.getAddress().col, removedColumnsFromMatrix.columnEnd - this.getAddress().col)
    }
  }

  public isComputed() {
    return (!(this.matrix instanceof NotComputedMatrix))
  }

  public columnsFromMatrix() {
    return ColumnsSpan.fromNumberOfColumns(this.cellAddress.sheet, this.cellAddress.col, this.width)
  }

  public rowsFromMatrix() {
    return RowsSpan.fromNumberOfRows(this.cellAddress.sheet, this.cellAddress.row, this.height)
  }
}
