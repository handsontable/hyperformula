/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
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

  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  public find(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchOptions: SearchOptions): number {
    return this.basicFind(searchKey, rangeValue, 'row', searchOptions)
  }
}
