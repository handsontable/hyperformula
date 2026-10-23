/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {CellValueChange} from '../ContentChanges'
import {DependencyGraph} from '../DependencyGraph'
import {RawNoErrorScalarValue, RawScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {ColumnsSpan} from '../Span'
import {AdvancedFind} from './AdvancedFind'
import {ColumnSearchStrategy, SearchOptions} from './SearchStrategy'

export class ColumnBinarySearch extends AdvancedFind implements ColumnSearchStrategy {
  constructor(protected dependencyGraph: DependencyGraph) {
    super(dependencyGraph)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars 
  public add(value: RawScalarValue, address: SimpleCellAddress): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove(value: RawScalarValue | undefined, address: SimpleCellAddress): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public change(oldValue: RawScalarValue | undefined, newValue: RawScalarValue, address: SimpleCellAddress): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public applyChanges(contentChanges: CellValueChange[]): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addColumns(columnsSpan: ColumnsSpan): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeColumns(columnsSpan: ColumnsSpan): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeSheet(sheetId: number): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public moveValues(sourceRange: IterableIterator<[RawScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>): void {
  }

  /**
   * No-op: ColumnBinarySearch reads cell values directly from the dependency graph
   * on every lookup, so it has no cached data that could become stale.
   * Unlike ColumnIndex, which maintains a separate value-to-address index that
   * must be kept in sync with lazy transformations, binary search always operates
   * on the current graph state.
   */
  public forceApplyPostponedTransformations(): void {
  }

  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  public find(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchOptions: SearchOptions): number {
    return this.basicFind(searchKey, rangeValue, 'row', searchOptions)
  }
}
