import {Ast} from '../parser'
import {CellValue, SimpleCellAddress} from '../Cell'

/**
 * Represents vertex which keeps formula
 */
export class FormulaCellVertex {
  /** Most recently computed value of this formula. */
  private cachedCellValue: CellValue | null

  /** Formula in AST format */
  private formula: Ast

  /** Address which this vertex represents */
  private cellAddress: SimpleCellAddress

  constructor(formula: Ast, cellAddress: SimpleCellAddress) {
    this.formula = formula
    this.cellAddress = cellAddress
    this.cachedCellValue = null
  }

  /**
   * Returns formula stored in this vertex
   */
  public getFormula(): Ast {
    return this.formula
  }

  public setFormula(formula: Ast) {
    this.formula = formula
    this.cachedCellValue = null
  }

  /**
   * Returns address of the cell associated with vertex
   */
  public getAddress(): SimpleCellAddress {
    return this.cellAddress
  }

  public setAddress(address: SimpleCellAddress) {
    this.cellAddress = address
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public setCellValue(cellValue: CellValue) {
    this.cachedCellValue = cellValue
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue(): CellValue {
    if (this.cachedCellValue !== null) {
      return this.cachedCellValue
    } else {
      throw Error('Value of the formula cell is not computed.')
    }
  }
}
