/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {EmptyValue, getRawValue, InternalScalarValue, InterpreterValue} from '../interpreter/InterpreterValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {ErroredMatrix, IMatrix, Matrix, NotComputedMatrix} from '../Matrix'
import {MatrixSize} from '../MatrixSize'
import {Maybe} from '../Maybe'
import {Ast} from '../parser'
import {ColumnsSpan, RowsSpan} from '../Span'

export abstract class FormulaVertex {
  static fromAst(formula: Ast, address: SimpleCellAddress, size: MatrixSize, version: number) {
    if (size.isScalar()) {
      return new FormulaCellVertex(formula, address, version)
    } else {
      return new MatrixVertex(formula, address, size, version)
    }
  }

  protected constructor(
    protected formula: Ast,
    protected cellAddress: SimpleCellAddress,
    public version: number
  ) {
  }

  public get width(): number {
    return 1
  }

  public get height(): number {
    return 1
  }

  /**
   * Returns formula stored in this vertex
   */
  public getFormula(updatingService: LazilyTransformingAstService): Ast {
    this.ensureRecentData(updatingService)
    return this.formula
  }

  public ensureRecentData(updatingService: LazilyTransformingAstService) {
    if (this.version != updatingService.version()) {
      const [newAst, newAddress, newVersion] = updatingService.applyTransformations(this.formula, this.cellAddress, this.version)
      this.formula = newAst
      this.cellAddress = newAddress
      this.version = newVersion
    }
  }

  /**
   * Returns address of the cell associated with vertex
   */
  public getAddress(updatingService: LazilyTransformingAstService): SimpleCellAddress {
    this.ensureRecentData(updatingService)
    return this.cellAddress
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public abstract setCellValue(cellValue: InterpreterValue): InterpreterValue

  /**
   * Returns cell value stored in vertex
   */
  public abstract getCellValue(): InterpreterValue

  public abstract valueOrNull(): InterpreterValue | null

  public abstract isComputed(): boolean
}

export class MatrixVertex extends FormulaVertex {
  matrix: IMatrix

  constructor(formula: Ast, cellAddress: SimpleCellAddress, size: MatrixSize, version: number = 0) {
    super(formula, cellAddress, version)
    this.matrix = new NotComputedMatrix(size)
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
    if (value instanceof CellError) {
      this.setErrorValue(value)
      return value
    }
    const matrix = Matrix.fromInterpreterValue(value)
    matrix.resize(this.matrix.size)
    this.matrix = matrix
    return value
  }

  getCellValue(): InterpreterValue {
    if (this.matrix instanceof NotComputedMatrix) {
      throw Error('Matrix not computed yet.')
    }
    return this.matrix.simpleRangeValue()
  }

  public valueOrNull(): InterpreterValue | null {
    if (this.matrix instanceof NotComputedMatrix) {
      return null
    }
    return this.matrix.simpleRangeValue()
  }

  getMatrixCellValue(address: SimpleCellAddress): InternalScalarValue {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row

    try {
      return this.matrix.get(col, row)
    } catch (e) {
      return new CellError(ErrorType.REF)
    }
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

  setAddress(address: SimpleCellAddress) {
    this.cellAddress = address
  }

  setFormula(newFormula: Ast) {
    this.formula = newFormula
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

  /* TODO cruds should ensure is recent data */
  addRows(sheet: number, row: number, numberOfRows: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addRows(row - this.cellAddress.row, numberOfRows)
    }
  }

  addColumns(sheet: number, column: number, numberOfColumns: number): void {
    if (this.matrix instanceof Matrix) {
      this.matrix.addColumns(column - this.cellAddress.col, numberOfColumns)
    }
  }

  removeRows(removedRows: RowsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedRowsFromMatrix = this.rowsFromMatrix().intersect(removedRows)!
      this.matrix.removeRows(removedRowsFromMatrix.rowStart - this.cellAddress.row, removedRowsFromMatrix.rowEnd - this.cellAddress.row)
    }
  }

  removeColumns(removedColumns: ColumnsSpan): void {
    if (this.matrix instanceof Matrix) {
      const removedColumnsFromMatrix = this.columnsFromMatrix().intersect(removedColumns)!
      this.matrix.removeColumns(removedColumnsFromMatrix.columnStart - this.cellAddress.col, removedColumnsFromMatrix.columnEnd - this.cellAddress.col)
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

  /**
   * No-op as matrix vertices are transformed eagerly.
   * */
  ensureRecentData(updatingService: LazilyTransformingAstService) {}

  private setErrorValue(error: CellError) {
    this.matrix = new ErroredMatrix(error, this.matrix.size)
  }
}

/**
 * Represents vertex which keeps formula
 */
export class FormulaCellVertex extends FormulaVertex {
  /** Most recently computed value of this formula. */
  private cachedCellValue: InterpreterValue | null

  constructor(
    /** Formula in AST format */
    formula: Ast,

    /** Address which this vertex represents */
    address: SimpleCellAddress,

    version: number,
  ) {
    super(formula, address, version)
    this.cachedCellValue = null
  }

  public valueOrNull(): InterpreterValue | null {
    return this.cachedCellValue
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public setCellValue(cellValue: InterpreterValue): InterpreterValue {
    this.cachedCellValue = cellValue
    return this.cachedCellValue
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue(): InterpreterValue {
    if (this.cachedCellValue !== null) {
      return this.cachedCellValue
    } else {
      throw Error('Value of the formula cell is not computed.')
    }
  }

  public isComputed() {
    return (this.cachedCellValue !== null)
  }
}
