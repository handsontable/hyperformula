/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '..'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CriterionLambda} from '../interpreter/Criterion'
import {Vertex} from './Vertex'

/**
 * Represents cache structure for one criterion
 */
export type CriterionCache = Map<string, [any, CriterionLambda[]]>

/**
 * Represents vertex bound to range
 */
export class RangeVertex extends Vertex {
  public bruteForce: boolean
  /** Cache for associative aggregate functions. */
  private functionCache: Map<string, any>
  /** Cache for criterion-based functions. */
  private criterionFunctionCache: Map<string, CriterionCache>
  private dependentCacheRanges: Set<RangeVertex>

  constructor(public range: AbsoluteCellRange) {
    super()
    this.functionCache = new Map()
    this.criterionFunctionCache = new Map()
    this.dependentCacheRanges = new Set()
    this.bruteForce = false
  }

  public get start(): SimpleCellAddress {
    return this.range.start
  }

  public get end(): SimpleCellAddress {
    return this.range.end
  }

  public get sheet(): number {
    return this.range.start.sheet
  }

  /**
   * Returns cached value stored for given function
   *
   * @param functionName - name of the function
   */
  public getFunctionValue(functionName: string): any {
    return this.functionCache.get(functionName)
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
  public getCriterionFunctionValue(cacheKey: string, criterionString: string) {
    return this.getCriterionFunctionValues(cacheKey).get(criterionString)?.[0]
  }

  /**
   * Returns all cached values stored for given criterion function
   *
   * @param cacheKey - key to retrieve from the cache
   */
  public getCriterionFunctionValues(cacheKey: string): Map<string, [any, CriterionLambda[]]> {
    return this.criterionFunctionCache.get(cacheKey) ?? new Map()
  }

  /**
   * Stores all values for given criterion function
   *
   * @param cacheKey - key to store in the cache
   * @param values - map with values
   */
  public setCriterionFunctionValues(cacheKey: string, values: CriterionCache) {
    this.criterionFunctionCache.set(cacheKey, values)
  }

  public addDependentCacheRange(dependentRange: RangeVertex) {
    if (dependentRange !== this) {
      this.dependentCacheRanges.add(dependentRange)
    }
  }

  /**
   * Clears function cache
   */
  public clearCache() {
    this.functionCache.clear()
    this.criterionFunctionCache.clear()
    this.dependentCacheRanges.forEach(range => range.criterionFunctionCache.clear())
    this.dependentCacheRanges.clear()
  }
}
