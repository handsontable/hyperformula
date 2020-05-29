/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalScalarValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {Matrix} from '../Matrix'
import {ColumnSearchStrategy} from './ColumnSearchStrategy'

export class ColumnBinarySearch implements ColumnSearchStrategy {
  constructor(
    private dependencyGraph: DependencyGraph,
    private config: Config,
  ) {}
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

  public find(key: InternalScalarValue, range: AbsoluteCellRange, sorted: boolean): number {
    if (range.height() < this.config.vlookupThreshold || !sorted) {
      const values = this.computeListOfValuesInRange(range)
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.row
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph)
    }
  }

  private computeListOfValuesInRange(range: AbsoluteCellRange): InternalScalarValue[] {
    const values: InternalScalarValue[] = []
    for (const cellFromRange of range.addresses(this.dependencyGraph)) {
      const value = this.dependencyGraph.getScalarValue(cellFromRange)
      values.push(value)
    }

    return values
  }
}
