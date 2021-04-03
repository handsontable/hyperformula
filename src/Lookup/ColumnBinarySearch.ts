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
  public add(value: RawScalarValue | Matrix, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove(value: RawScalarValue | Matrix | null, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public change(oldValue: RawScalarValue | Matrix | null, newValue: RawScalarValue | Matrix, address: SimpleCellAddress): void {}
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

  public find(key: RawNoErrorScalarValue, range: AbsoluteCellRange, sorted: boolean): number {
    if(typeof key === 'string') {
      key = forceNormalizeString(key)
    }
    if (range.height() < this.config.binarySearchThreshold || !sorted) {
      const values = this.dependencyGraph.computeListOfValuesInRange(range).map(getRawValue).map(arg =>
        (typeof arg === 'string') ? forceNormalizeString(arg) : arg
      )
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.row
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'row')
    }
  }
}
