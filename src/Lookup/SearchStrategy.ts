/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {CellValueChange} from '../ContentChanges'
import {DependencyGraph} from '../DependencyGraph'
import {RawInterpreterValue, RawNoErrorScalarValue, RawScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ColumnsSpan} from '../Span'
import {Statistics} from '../statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'

/**
 * Selects how approximate lower and upper bounds handle non-empty candidates whose scalar type
 * differs from the lookup value's type.
 *
 * Mode semantics:
 *
 * - `'sameType'` accepts only candidates with the same JavaScript scalar type as the lookup value.
 *   `MATCH`, `VLOOKUP`, and `HLOOKUP` use this policy.
 * - `'totalOrder'` accepts cross-type candidates and orders them with the lookup comparator.
 *   `XLOOKUP` uses this policy to match Microsoft Excel.
 * - Exact matches are unaffected. The policy is required so every search strategy receives an
 *   explicit choice and linear, indexed, and binary paths cannot silently diverge.
 *
 * @internal
 */
export type ApproximateMatchPolicy = 'sameType' | 'totalOrder'

/**
 * Defines the lookup semantics passed to a search strategy.
 *
 * @property {('asc'|'desc'|'none')} ordering - Ordering assumed by the selected search algorithm.
 * @property {('returnLowerBound'|'returnUpperBound'|'returnNotFound')} ifNoMatch - Result requested when an exact value is absent.
 * @property {ApproximateMatchPolicy} approximateMatchPolicy - Cross-type candidate policy for approximate bounds; exact matches ignore it.
 * @property {('first'|'last')} [returnOccurrence] - Which exact duplicate to return.
 * @internal
 */
export interface SearchOptions {
  ordering: 'asc' | 'desc' | 'none',
  ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound',
  approximateMatchPolicy: ApproximateMatchPolicy,
  returnOccurrence?: 'first' | 'last',
}

export interface AdvancedFindOptions {
  returnOccurrence?: 'first' | 'last',
}

export interface SearchStrategy {
  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  find(searchKey: RawNoErrorScalarValue, range: SimpleRangeValue, options: SearchOptions): number,

  advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, range: SimpleRangeValue, options: AdvancedFindOptions): number,
}

export interface ColumnSearchStrategy extends SearchStrategy {
  add(value: RawInterpreterValue, address: SimpleCellAddress): void,

  remove(value: RawInterpreterValue | undefined, address: SimpleCellAddress): void,

  change(oldValue: RawInterpreterValue | undefined, newValue: RawInterpreterValue, address: SimpleCellAddress): void,

  applyChanges(contentChanges: CellValueChange[]): void,

  addColumns(columnsSpan: ColumnsSpan): void,

  removeColumns(columnsSpan: ColumnsSpan): void,

  removeSheet(sheetId: number): void,

  moveValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void,

  removeValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>): void,

  /**
   * Forces all lazily-tracked ValueIndex entries to apply any pending transformations,
   * bringing every entry's version up to the current LazilyTransformingAstService version.
   * Must be called before compacting LazilyTransformingAstService.
   */
  forceApplyPostponedTransformations(): void,
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): ColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph)
  }
}
