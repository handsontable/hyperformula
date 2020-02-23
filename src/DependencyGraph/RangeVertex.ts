import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {CriterionLambda} from '../interpreter/Criterion'

/**
 * Represents cache structure for one criterion
 */
export type CriterionCache = Map<string, [any, CriterionLambda[]]>

/**
 * Represents vertex bound to range
 */
export class RangeVertex {
  /** Cache for associative aggregate functions. */
  private functionCache: Map<string, any>

  /** Cache for criterion-based functions. */
  private criterionFuncitonCache: Map<string, CriterionCache>

  constructor(public range: AbsoluteCellRange) {
    this.functionCache = new Map()
    this.criterionFuncitonCache = new Map()
  }

  public get start() {
    return this.range.start
  }

  public get end() {
    return this.range.end
  }

  public get sheet() {
    return this.range.start.sheet
  }

  /**
   * Returns cached value stored for given function
   *
   * @param functionName - name of the function
   */
  public getFunctionValue(functionName: string): any {
    return this.functionCache.get(functionName) || null
  }

  /**
   * Stores cached value for given function
   *
   * @param functionName - name of the function
   * @param value - cached value
   */
  public setFunctionValue(functionName: string, value: any) {
    this.functionCache.set(functionName, value)
  }

  /**
   * Returns cached value for given cache key and criterion text representation
   *
   * @param cacheKey - key to retrieve from the cache
   * @param criterionString - criterion text (ex. '<=5')
   */
  public getCriterionFunctionValue(cacheKey: string, criterionString: string): any | null {
    const values = this.getCriterionFunctionValues(cacheKey)
    const value = values.get(criterionString)
    return value ? value[0] : null
  }

  /**
   * Returns all cached values stored for given criterion function
   *
   * @param cacheKey - key to retrieve from the cache
   */
  public getCriterionFunctionValues(cacheKey: string): Map<string, [any, CriterionLambda[]]> {
    return this.criterionFuncitonCache.get(cacheKey) || new Map()
  }

  /**
   * Stores all values for given criterion function
   *
   * @param cacheKey - key to store in the cache
   * @param values - map with values
   */
  public setCriterionFunctionValues(cacheKey: string, values: CriterionCache) {
    this.criterionFuncitonCache.set(cacheKey, values)
  }

  /**
   * Clears function cache
   */
  public clearCache() {
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
