/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {CellValueChange} from '../ContentChanges'
import {DependencyGraph} from '../DependencyGraph'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {getRawValue, RawNoErrorScalarValue, RawScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
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

  public find(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: boolean): number {
    if (typeof key === 'string') {
      key = forceNormalizeString(key)
    }
    const range = rangeValue.range
    if (range === undefined) {
      return rangeValue.valuesFromTopLeftCorner().map(getRawValue).map(arg =>
        (typeof arg === 'string') ? forceNormalizeString(arg) : arg
      ).indexOf(key)
    } else if (!sorted) {
      return this.dependencyGraph.computeListOfValuesInRange(range).findIndex(arg => {
        arg = getRawValue(arg)
        arg = (typeof arg === 'string') ? forceNormalizeString(arg) : arg
        return arg === key
      })
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'row')
    }
  }
}
