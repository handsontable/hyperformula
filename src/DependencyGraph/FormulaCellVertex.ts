/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {ArraySize} from '../ArraySize'
import {ArrayValue, ErroredArray, IArray, NotComputedArray} from '../ArrayValue'
import {CellError, equalSimpleCellAddress, ErrorType, SimpleCellAddress} from '../Cell'
import {RawCellContent} from '../CellContentParser'
import {ErrorMessage} from '../error-message'
import {AsyncInterpreterValue, EmptyValue, getRawValue, InternalScalarValue, InterpreterValue} from '../interpreter/InterpreterValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Maybe} from '../Maybe'
import {Ast} from '../parser'
import {ColumnsSpan, RowsSpan} from '../Span'

export interface AsyncVertex {
  asyncResolveIndex?: number,
  getPromise?: () => AsyncInterpreterValue,
}

export abstract class FormulaVertex implements AsyncVertex {
  public asyncResolveIndex?: number
  public getPromise?: () => AsyncInterpreterValue

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

  static fromAst(formula: Ast, address: SimpleCellAddress, size: ArraySize, version: number) {
    if (size.isScalar()) {
      return new FormulaCellVertex(formula, address, version)
    } else {
      return new ArrayVertex(formula, address, size, version)
    }
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

  public abstract valueOrUndef(): Maybe<InterpreterValue>

  public abstract isComputed(): boolean
}

export class ArrayVertex extends FormulaVertex {
  array: IArray

  constructor(formula: Ast, cellAddress: SimpleCellAddress, size: ArraySize, version: number = 0) {
    super(formula, cellAddress, version)
    if (size.isRef) {
      this.array = new ErroredArray(new CellError(ErrorType.REF, ErrorMessage.NoSpaceForArrayResult), ArraySize.error())
    } else {
      this.array = new NotComputedArray(size)
    }
  }

  get width(): number {
    return this.array.width()
  }

  get height(): number {
    return this.array.height()
  }

  get sheet(): number {
    return this.cellAddress.sheet
  }

  get leftCorner(): SimpleCellAddress {
    return this.cellAddress
  }

  setCellValue(value: InterpreterValue): InterpreterValue {
    if (value instanceof CellError) {
      this.setErrorValue(value)
      return value
    }
    const array = ArrayValue.fromInterpreterValue(value)
    array.resize(this.array.size)
    this.array = array
    return value
  }

  getCellValue(): InterpreterValue {
    if (this.array instanceof NotComputedArray) {
      throw Error('Array not computed yet.')
    }
    return this.array.simpleRangeValue()
  }

  public valueOrUndef(): Maybe<InterpreterValue> {
    if (this.array instanceof NotComputedArray) {
      return undefined
    }
    return this.array.simpleRangeValue()
  }

  getArrayCellValue(address: SimpleCellAddress): InternalScalarValue {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row

    try {
      return this.array.get(col, row)
    } catch (e) {
      return new CellError(ErrorType.REF)
    }
  }

  getArrayCellRawValue(address: SimpleCellAddress): Maybe<RawCellContent> {
    const val = this.getArrayCellValue(address)
    if (val instanceof CellError || val === EmptyValue) {
      return undefined
    } else {
      return getRawValue(val)
    }
  }

  setArrayCellValue(address: SimpleCellAddress, value: number): void {
    const col = address.col - this.cellAddress.col
    const row = address.row - this.cellAddress.row
    if (this.array instanceof ArrayValue) {
      this.array.set(col, row, value)
    }
  }

  setNoSpace(): InterpreterValue {
    this.array = new ErroredArray(new CellError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult), ArraySize.error())
    return this.getCellValue()
  }

  getRange(): AbsoluteCellRange {
    return AbsoluteCellRange.spanFrom(this.cellAddress, this.width, this.height)
  }

  getRangeOrUndef(): Maybe<AbsoluteCellRange> {
    return AbsoluteCellRange.spanFromOrUndef(this.cellAddress, this.width, this.height)
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

  isComputed() {
    return (!(this.array instanceof NotComputedArray))
  }

  columnsFromArray() {
    return ColumnsSpan.fromNumberOfColumns(this.cellAddress.sheet, this.cellAddress.col, this.width)
  }

  rowsFromArray() {
    return RowsSpan.fromNumberOfRows(this.cellAddress.sheet, this.cellAddress.row, this.height)
  }

  /**
   * No-op as array vertices are transformed eagerly.
   * */
  ensureRecentData(_updatingService: LazilyTransformingAstService) {
  }

  isLeftCorner(address: SimpleCellAddress): boolean {
    return equalSimpleCellAddress(this.cellAddress, address)
  }

  private setErrorValue(error: CellError) {
    this.array = new ErroredArray(error, this.array.size)
  }
}

/**
 * Represents vertex which keeps formula
 */
export class FormulaCellVertex extends FormulaVertex {
  /** Most recently computed value of this formula. */
  private cachedCellValue?: InterpreterValue

  constructor(
    /** Formula in AST format */
    formula: Ast,
    /** Address which this vertex represents */
    address: SimpleCellAddress,
    version: number,
  ) {
    super(formula, address, version)
  }

  public valueOrUndef(): Maybe<InterpreterValue> {
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
    if (this.cachedCellValue !== undefined) {
      return this.cachedCellValue
    } else {
      throw Error('Value of the formula cell is not computed.')
    }
  }

  public isComputed() {
    return (this.cachedCellValue !== undefined)
  }
}
