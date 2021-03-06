/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalNoErrorScalarValue, InternalScalarValue, SimpleCellAddress} from '../Cell'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {InterpreterValue} from '../interpreter/InterpreterValue'
import {Matrix} from '../Matrix'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'
import {ColumnsSpan} from '../Span'

export interface SearchStrategy {
  find(key: InternalNoErrorScalarValue, range: AbsoluteCellRange, sorted: boolean): number,

  advancedFind(keyMatcher: (arg: InternalScalarValue) => boolean, range: AbsoluteCellRange): number,
}

export interface ColumnSearchStrategy extends SearchStrategy {
  add(value: InterpreterValue | Matrix, address: SimpleCellAddress): void,

  remove(value: InterpreterValue | Matrix | null, address: SimpleCellAddress): void,

  change(oldValue: InterpreterValue | Matrix | null, newValue: InterpreterValue | Matrix, address: SimpleCellAddress): void,

  addColumns(columnsSpan: ColumnsSpan): void,

  removeColumns(columnsSpan: ColumnsSpan): void,

  removeSheet(sheetId: number): void,

  moveValues(range: IterableIterator<[InternalScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void,

  removeValues(range: IterableIterator<[InternalScalarValue, SimpleCellAddress]>): void,

  destroy(): void,
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): ColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
