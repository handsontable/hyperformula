/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {getRawValue, RawNoErrorScalarValue, RawScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
import {Matrix} from '../Matrix'
import {ColumnsSpan} from '../Span'
import {AdvancedFind} from './AdvancedFind'
import {ColumnSearchStrategy} from './SearchStrategy'

export class ColumnBinarySearch extends AdvancedFind implements ColumnSearchStrategy {
  constructor(
    protected dependencyGraph: DependencyGraph,
    private config: Config,
  ) {
    super(dependencyGraph)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars 
  public add(value: RawScalarValue, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove(value: RawScalarValue | null, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public change(oldValue: RawScalarValue | null, newValue: RawScalarValue, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeSheet(sheetId: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public moveValues(sourceRange: IterableIterator<[RawScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>): void {}

  public destroy(): void {}

  public find(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: boolean): number {
    if(typeof key === 'string') {
      key = forceNormalizeString(key)
    }
    const range = rangeValue.range
    if(range === undefined) {
      return rangeValue.valuesFromTopLeftCorner().map(getRawValue).map(arg =>
        (typeof arg === 'string') ? forceNormalizeString(arg) : arg
      ).indexOf(key)
    } else if (range.height() < this.config.binarySearchThreshold || !sorted) {
      return this.dependencyGraph.computeListOfValuesInRange(range).map(getRawValue).indexOf(key)
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'row')
    }
  }
}
