import {CellValue, SimpleCellAddress} from '../Cell'
import {Ast} from '../parser'
import {LazilyTransformingAstService} from '../HandsOnEngine'

/**
 * Represents vertex which keeps formula
 */
export class FormulaCellVertex {
  /** Most recently computed value of this formula. */
  private cachedCellValue: CellValue | null

  constructor(
    /** Formula in AST format */
    private formula: Ast,

    /** Address which this vertex represents */
    public cellAddress: SimpleCellAddress,

    public version: number
  ) {
    this.formula = formula
    this.cellAddress = cellAddress
    this.cachedCellValue = null
  }

  /**
   * Returns formula stored in this vertex
   */
  public getFormula(updatingService: LazilyTransformingAstService): Ast {
    this.ensureRecentData(updatingService)
    return this.formula
  }

  private ensureRecentData(updatingService: LazilyTransformingAstService) {
    if (this.version != updatingService.version()) {
      const [newAst, newAddress, newVersion] = updatingService.applyTransformations(this.formula, this.address, this.version)
      this.formula = newAst
      this.cellAddress = newAddress
      this.version = newVersion
    }
  }

  public setFormula(formula: Ast) {
    this.formula = formula
  }

  /**
   * Returns address of the cell associated with vertex
   */
  public getAddress(updatingService: LazilyTransformingAstService): SimpleCellAddress {
    this.ensureRecentData(updatingService)
    return this.cellAddress
  }

  public setAddress(address: SimpleCellAddress) {
    this.cellAddress = address
  }

  public get address() {
    return this.cellAddress
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

  public isComputed() {
    return (this.cachedCellValue !== null)
  }
}
