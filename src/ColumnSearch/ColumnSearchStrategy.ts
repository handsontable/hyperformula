/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalScalarValue, InternalCellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {Matrix} from '../Matrix'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'

export interface ColumnSearchStrategy {
  add(value: InternalCellValue | Matrix, address: SimpleCellAddress): void,

  remove(value: InternalCellValue | Matrix | null, address: SimpleCellAddress): void,

  change(oldValue: InternalCellValue | Matrix | null, newValue: InternalCellValue | Matrix, address: SimpleCellAddress): void,

  addColumns(columnsSpan: ColumnsSpan): void,

  removeColumns(columnsSpan: ColumnsSpan): void,

  removeSheet(sheetId: number): void,

  moveValues(range: IterableIterator<[InternalScalarValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void,

  removeValues(range: IterableIterator<[InternalScalarValue, SimpleCellAddress]>): void,

  find(key: InternalScalarValue, range: AbsoluteCellRange, sorted: boolean): number,

  destroy(): void,
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): ColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
