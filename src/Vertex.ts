import {CellValue, SimpleCellAddress} from './Cell'
import {Ast} from './parser/Ast'

/**
 * Abstract class for any vertex
 */
export abstract class Vertex {
}

/**
 * Represents vertex bound to some particular cell
 */
export abstract class CellVertex extends Vertex {
  /**
   * Returns cell value stored in vertex
   */
  public abstract getCellValue(): CellValue
}

/**
 * Represents vertex which keeps formula
 */
export class FormulaCellVertex extends CellVertex {
  private cachedCellValue?: CellValue
  private formula: Ast
  private cellAddress: SimpleCellAddress

  constructor(formula: Ast, cellAddress: SimpleCellAddress) {
    super()
    this.formula = formula
    this.cellAddress = cellAddress
  }

  /**
   * Returns formula stored in this vertex
   */
  public getFormula(): Ast {
    return this.formula
  }

  /**
   * Returns address of the cell associated with vertex
   */
  public getAddress(): SimpleCellAddress {
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
  public getCellValue() {
    if (this.cachedCellValue != null) {
      return this.cachedCellValue
    } else {
      throw Error('Value of the formula cell is not computed.')
    }
  }
}

/**
 * Represents vertex which keeps static cell value
 */
export class ValueCellVertex extends CellVertex {
  private cellValue: CellValue

  constructor(cellValue: CellValue) {
    super()
    this.cellValue = cellValue
  }

  /**
   * Returns cell value stored in vertex
   */
  public getCellValue() {
    return this.cellValue
  }

  /**
   * Sets computed cell value stored in this vertex
   */
  public setCellValue(cellValue: CellValue) {
    this.cellValue = cellValue
  }
}

/**
 * Represents singleton vertex bound to all empty cells
 */
export class EmptyCellVertex extends CellVertex {

  /**
   * Retrieves singleton
   */
  public static getSingletonInstance() {
    if (!EmptyCellVertex.instance) {
      EmptyCellVertex.instance = new EmptyCellVertex()
    }
    return EmptyCellVertex.instance
  }
  private static instance: EmptyCellVertex

  constructor() {
    super()
  }

  /**
   * Retrieves cell value bound to that singleton
   */
  public getCellValue() {
    return 0
  }
}

/**
 * Represents vertex bound to range
 */
export class RangeVertex extends Vertex {
  private valueCache: Map<string, CellValue>

  constructor(private start: SimpleCellAddress, private end: SimpleCellAddress) {
    super()
    this.valueCache = new Map()
  }

  /**
   * Returns cached value stored for given function
   *
   * @param functionName - name of the function
   */
  public getRangeValue(functionName: string): CellValue | null {
    return this.valueCache.get(functionName) || null
  }

  /**
   * Stores cached value for given function
   *
   * @param functionName - name of the function
   * @param value - cached value
   */
  public setRangeValue(functionName: string, value: CellValue) {
    this.valueCache.set(functionName, value)
  }

  /**
   * Clears function cache
   */
  public clear() {
    this.valueCache.clear()
  }

  /**
   * Returns start of the range (it's top-left corner)
   */
  public getStart(): SimpleCellAddress {
    return this.start
  }

  /**
   * Returns end of the range (it's bottom-right corner)
   */
  public getEnd(): SimpleCellAddress {
    return this.end
  }
}
