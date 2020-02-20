import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalCellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {Matrix} from '../Matrix'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'

export interface IColumnSearchStrategy {
  add(value: InternalCellValue | Matrix, address: SimpleCellAddress): void,

  remove(value: InternalCellValue | Matrix | null, address: SimpleCellAddress): void,

  change(oldValue: InternalCellValue | Matrix | null, newValue: InternalCellValue | Matrix, address: SimpleCellAddress): void,

  addColumns(columnsSpan: ColumnsSpan): void,

  removeColumns(columnsSpan: ColumnsSpan): void,

  removeSheet(sheetId: number): void,

  moveValues(range: IterableIterator<[InternalCellValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void,

  removeValues(range: IterableIterator<[InternalCellValue, SimpleCellAddress]>): void,

  find(key: any, range: AbsoluteCellRange, sorted: boolean): number,

  destroy(): void,
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): IColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
