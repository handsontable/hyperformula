import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'

export interface IColumnSearchStrategy {
  add(value: CellValue, address: SimpleCellAddress): void

  remove(value: CellValue | null, address: SimpleCellAddress): void

  change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress): void

  addColumns(columnsSpan: ColumnsSpan): void

  removeColumns(columnsSpan: ColumnsSpan): void

  find(key: any, range: AbsoluteCellRange, sorted: boolean): number
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): IColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(statistics, dependencyGraph.lazilyTransformingAstService)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
