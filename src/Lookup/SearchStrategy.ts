/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {
  RawInterpreterValue,
  RawNoErrorScalarValue, RawScalarValue
} from '../interpreter/InterpreterValue'
import {Matrix} from '../Matrix'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'
import {ColumnsSpan} from '../Span'

export interface SearchStrategy {
  find(key: RawNoErrorScalarValue, range: AbsoluteCellRange, sorted: boolean): number,

  advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, range: AbsoluteCellRange): number,
}

export interface ColumnSearchStrategy extends SearchStrategy {
  add(value: RawInterpreterValue | Matrix, address: SimpleCellAddress): void,

  remove(value: RawInterpreterValue | Matrix | null, address: SimpleCellAddress): void,

  change(oldValue: RawInterpreterValue | Matrix | null, newValue: RawInterpreterValue | Matrix, address: SimpleCellAddress): void,

  addColumns(columnsSpan: ColumnsSpan): void,

  removeColumns(columnsSpan: ColumnsSpan): void,

  removeSheet(sheetId: number): void,

  moveValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void,

  removeValues(range: IterableIterator<[RawScalarValue, SimpleCellAddress]>): void,

  destroy(): void,
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): ColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
