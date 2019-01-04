import {CellValue, SimpleCellAddress} from './Cell'
import {CriterionLambda} from './interpreter/Criterion'
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
  /** Most recently computed value of this formula. */
  private cachedCellValue?: CellValue

  /** Formula in AST format */
  private formula: Ast

  /** Address which this vertex represents */
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
  /** Static cell value. */
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
  
  /** Singleton instance. */
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
* Represents cache structure for one criterion
*/
export type CriterionCache = Map<string, [CellValue, CriterionLambda]>

/**
 * Represents vertex bound to range
 */
export class RangeVertex extends Vertex {
  /** Cache for associative aggregate functions. */
  private functionCache: Map<string, CellValue>
  
  /** Cache for criterion-based functions. */
  private criterionFuncitonCache: Map<string, CriterionCache>

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
   * Returns cached value stored for given function name, left corner of condition range and criterion text representation
   *
   * @param functionName - name of the function
   * @param leftCorner - left corner of condition range
   * @param criterionString - criterion text (ex. '<=5')
   */
  public getCriterionFunctionValue(functionName: string, leftCorner: SimpleCellAddress, criterionString: string): CellValue | null {
    const values = this.getCriterionFunctionValues(functionName, leftCorner)
    if (values) {
      const value = values.get(criterionString)
      return value ? value[0] : null
    }
    return null
  }

  /**
   * Returns all cached values stored for given criterion function
   *
   * @param functionName - name of the function
   * @param leftCorner - left corner of condition range
   */
  public getCriterionFunctionValues(functionName: string, leftCorner: SimpleCellAddress): Map<string, [CellValue, CriterionLambda]> {
    return this.criterionFuncitonCache.get(this.criterionFunctioncache(functionName, leftCorner)) || new Map()
  }

  /**
   * Stores all values for given criterion function
   *
   * @param functionName - name of the function
   * @param leftCorner - left corner of condition range
   * @param values - map with values
   */
  public setCriterionFunctionValues(functionName: string, leftCorner: SimpleCellAddress, values: CriterionCache) {
    this.criterionFuncitonCache.set(this.criterionFunctioncache(functionName, leftCorner), values)
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

  /** Computes key for criterion function cache */
  private criterionFunctioncache(functionName: string, leftCorner: SimpleCellAddress) {
    return `${functionName},${leftCorner.col},${leftCorner.row}`
  }
}
