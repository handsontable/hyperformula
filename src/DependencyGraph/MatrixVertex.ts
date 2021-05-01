/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue} from '../interpreter/InterpreterValue'
import {ErroredMatrix, IMatrix, Matrix, NotComputedMatrix} from '../Matrix'
import {MatrixSize} from '../MatrixSize'
import {Maybe} from '../Maybe'
import {Ast} from '../parser'
import {ColumnsSpan, RowsSpan} from '../Span'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
import {ErrorMessage} from '../error-message'
import {FormulaVertex} from './FormulaCellVertex'

export interface IMatrixVertex {
  readonly width: number,
  readonly height: number,
  readonly sheet: number,
  matrix: IMatrix,
  cellAddress: SimpleCellAddress,
  formula?: Ast,

  setCellValue(matrix: InterpreterValue): void,
  getCellValue(): InterpreterValue,
  getMatrixCellValue(address: SimpleCellAddress): InternalScalarValue,
  getMatrixCellRawValue(address: SimpleCellAddress): Maybe<RawCellContent>,
  setMatrixCellValue(address: SimpleCellAddress, value: number): void,
  getRange(): AbsoluteCellRange,
  getAddress(): SimpleCellAddress,
  setAddress(address: SimpleCellAddress): void,
  getFormula(): Maybe<Ast>,
  setFormula(newFormula: Ast): void,
  isFormula(): boolean,
  isNumeric(): boolean,
  spansThroughSheetRows(sheet: number, startRow: number, endRow: number): boolean,
  spansThroughSheetColumn(sheet: number, col: number, columnEnd: number): boolean,
  addRows(sheet: number, row: number, numberOfRows: number): void,
  addColumns(sheet: number, column: number, numberOfColumns: number): void,
  removeRows(removedRows: RowsSpan): void,
  removeColumns(removedColumns: ColumnsSpan): void,
  isComputed(): boolean,
  columnsFromMatrix(): ColumnsSpan,
  rowsFromMatrix(): RowsSpan,
}

export class MatrixVertex extends FormulaVertex implements IMatrixVertex {
  matrix: IMatrix

  constructor(public cellAddress: SimpleCellAddress, width: number, height: number, public formula: Ast, version: number) {
    super(formula, cellAddress, version)
    this.matrix = new NotComputedMatrix(new MatrixSize(width, height))
  }

  get width(): number {
    return this.matrix.width()
  }

  get height(): number {
    return this.matrix.height()
  }

  get sheet(): number {
    return this.cellAddress.sheet
  }

  setCellValue(value: InterpreterValue): InterpreterValue {
    if(value instanceof SimpleRangeValue && value.isAdHoc()) {
      this.matrix = new Matrix(value.data)
      return value
    } else {
      let errorVal: CellError
      if (value instanceof CellError) {
        errorVal = value
      } else if (value instanceof SimpleRangeValue) {
        errorVal = new CellError(ErrorType.VALUE, ErrorMessage.CellRangeExpected)
      } else {
        /* TODO throw runtime? */
        errorVal = new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      }
      this.setErrorValue(errorVal)
      return errorVal
    }
    /* TODO */
    throw Error('Should not happen')
  }

  getCellValue(): InterpreterValue {
    if (this.matrix instanceof NotComputedMatrix) {
      throw Error('Matrix not computed yet.')
    }
    return this.matrix.simpleRangeValue()
  }

  getMatrixCellValue(address: SimpleCellAddress): InternalScalarValue {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row

    return this.matrix.get(col, row)
  }

  getMatrixCellRawValue(address: SimpleCellAddress): Maybe<RawCellContent> {
    const val = this.getMatrixCellValue(address)
    if (val instanceof CellError || val === EmptyValue) {
      return undefined
    } else {
      return getRawValue(val)
    }
  }

  setMatrixCellValue(address: SimpleCellAddress, value: number): void {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row
    if (this.matrix instanceof Matrix) {
      this.matrix.set(col, row, value)
    }
  }

  getRange(): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(this.cellAddress, this.width, this.height)
  }

  getAddress(): SimpleCellAddress {
    return this.cellAddress
  }

  setAddress(address: SimpleCellAddress) {
    this.cellAddress = address
  }

  getFormula(): Ast {
    if (this.formula == undefined) {
      /* TODO */
      throw Error('TODO formula should not be undefined')
    }
    return this.formula
  }

  setFormula(newFormula: Ast) {
    this.formula = newFormula
  }

  isFormula(): boolean {
    return this.formula !== undefined
  }

  isNumeric(): boolean {
    return this.formula === undefined
  }

  spansThroughSheetRows(sheet: number, startRow: number, endRow: number = startRow): boolean {
    return (this.cellAddress.sheet === sheet) &&
      (this.cellAddress.row <= endRow) &&
      (startRow < this.cellAddress.row + this.height)
  }

  spansThroughSheetColumn(sheet: number, col: number, columnEnd: number = col): boolean {
    return (this.cellAddress.sheet === sheet) &&
      (this.cellAddress.col <= columnEnd) &&
      (col < this.cellAddress.col + this.width)
  }

  addRows(sheet: number, row: number, numberOfRows: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addRows(row - this.getAddress().row, numberOfRows)
    }
  }

  addColumns(sheet: number, column: number, numberOfColumns: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addColumns(column - this.getAddress().col, numberOfColumns)
    }
  }

  removeRows(removedRows: RowsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedRowsFromMatrix = this.rowsFromMatrix().intersect(removedRows)!
      this.matrix.removeRows(removedRowsFromMatrix.rowStart - this.getAddress().row, removedRowsFromMatrix.rowEnd - this.getAddress().row)
    }
  }

  removeColumns(removedColumns: ColumnsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedColumnsFromMatrix = this.columnsFromMatrix().intersect(removedColumns)!
      this.matrix.removeColumns(removedColumnsFromMatrix.columnStart - this.getAddress().col, removedColumnsFromMatrix.columnEnd - this.getAddress().col)
    }
  }

  isComputed() {
    return (!(this.matrix instanceof NotComputedMatrix))
  }

  columnsFromMatrix() {
    return ColumnsSpan.fromNumberOfColumns(this.cellAddress.sheet, this.cellAddress.col, this.width)
  }

  rowsFromMatrix() {
    return RowsSpan.fromNumberOfRows(this.cellAddress.sheet, this.cellAddress.row, this.height)
  }

  private setErrorValue(error: CellError) {
    this.matrix = new ErroredMatrix(error, this.matrix.size)
  }
}
