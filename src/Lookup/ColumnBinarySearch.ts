/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalNoErrorScalarValue, InternalScalarValue, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {Matrix} from '../Matrix'
import {ColumnSearchStrategy} from './SearchStrategy'
import {ColumnsSpan} from '../Span'
import {AdvancedFind} from './AdvancedFind'

export class ColumnBinarySearch extends AdvancedFind implements ColumnSearchStrategy {
  constructor(
    protected dependencyGraph: DependencyGraph,
    private config: Config,
  ) {
    super(dependencyGraph)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars 
  public add(value: InternalScalarValue | Matrix, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove(value: InternalScalarValue | Matrix | null, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public change(oldValue: InternalScalarValue | Matrix | null, newValue: InternalScalarValue | Matrix, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeSheet(sheetId: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public moveValues(sourceRange: IterableIterator<[InternalScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeValues(range: IterableIterator<[InternalScalarValue, SimpleCellAddress]>): void {}

  public destroy(): void {}

  public find(key: InternalNoErrorScalarValue, range: AbsoluteCellRange, sorted: boolean): number {
    if (range.height() < this.config.binarySearchThreshold || !sorted) {
      const values = this.dependencyGraph.computeListOfValuesInRange(range)
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.row
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'row')
    }
  }
}
