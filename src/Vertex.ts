import {CellValue, SimpleCellAddress} from './Cell'
import {Ast} from './parser/Ast'
import {Criterion} from "./interpreter/Criterion";

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
  private functionCache: Map<string, CellValue>
  private criterionFuncitonCache: Map<string, [CellValue, Criterion]>

  constructor(private start: SimpleCellAddress, private end: SimpleCellAddress) {
    super()
    this.functionCache = new Map()
    this.criterionFuncitonCache = new Map()
  }

  /**
   * Returns cached value stored for given function
   *
   * @param functionName - name of the function
   */
  public getFunctionValue(functionName: string): CellValue | null {
    return this.functionCache.get(functionName) || null
  }

  /**
   * Stores cached value for given function
   *
   * @param functionName - name of the function
   * @param value - cached value
   */
  public setFunctionValue(functionName: string, value: CellValue) {
    this.functionCache.set(functionName, value)
  }

  /**
   * Returns cached value stored for given function with criterion
   *
   * @param hash - name of the function with additional parameters
   */
  public getCriterionFunctionValue(hash: string): [CellValue | null, Criterion | null] {
    return this.criterionFuncitonCache.get(hash) || [null, null]
  }

  /**
   * Stores cached value for given function with criterion
   *
   * @param hash - name of the function with additional parameters
   * @param criterion - cached criterion
   * @param value - cached value
   */
  public setCriterionFunctionValue(hash: string, criterion: Criterion, value: CellValue) {
    this.criterionFuncitonCache.set(hash, [value, criterion])
  }

  /**
   * Clears function cache
   */
  public clear() {
    this.functionCache.clear()
    this.criterionFuncitonCache.clear()
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
