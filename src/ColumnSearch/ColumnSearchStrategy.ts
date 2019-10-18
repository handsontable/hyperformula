import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, SimpleCellAddress} from '../Cell'
import {Matrix} from '../Matrix'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {Statistics} from '../statistics/Statistics'
import {ColumnBinarySearch} from './ColumnBinarySearch'
import {ColumnIndex} from './ColumnIndex'

export interface IColumnSearchStrategy {
  add(value: CellValue | Matrix, address: SimpleCellAddress): void

  remove(value: CellValue | Matrix | null, address: SimpleCellAddress): void

  change(oldValue: CellValue | Matrix | null, newValue: CellValue | Matrix, address: SimpleCellAddress): void

  addColumns(columnsSpan: ColumnsSpan): void

  removeColumns(columnsSpan: ColumnsSpan): void

  removeSheet(sheetId: number): void

  find(key: any, range: AbsoluteCellRange, sorted: boolean): number
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): IColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(dependencyGraph, config, statistics)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
