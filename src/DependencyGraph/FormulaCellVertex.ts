/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {InterpreterValue} from '../interpreter/InterpreterValue'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Ast} from '../parser'

export abstract class FormulaVertex {
  protected constructor(
    protected formula: Ast,
    protected cellAddress: SimpleCellAddress,
    public version: number
  ) {
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

  public abstract isComputed(): boolean
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
    cellAddress: SimpleCellAddress,

    version: number,
  ) {
    super(formula, cellAddress, version)
    this.formula = formula
    this.cellAddress = cellAddress
    this.cachedCellValue = null
  }

  public get address() {
    return this.cellAddress
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
