import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {lowerBound} from '../interpreter/binarySearch'
import {IColumnSearchStrategy} from './ColumnSearchStrategy'

export class ColumnBinarySearch implements IColumnSearchStrategy {
  constructor(
      private dependencyGraph: DependencyGraph,
      private config: Config,
  ) {}

  public add(value: CellValue, address: SimpleCellAddress): void {}

  public remove(value: CellValue | null, address: SimpleCellAddress): void {}

  public change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress): void {}

  public addColumns(columnsSpan: ColumnsSpan): void {}

  public removeColumns(columnsSpan: ColumnsSpan): void {}

  public find(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    const values = this.computeListOfValuesInRange(range)
    let index = -1
    if (values.length < this.config.vlookupThreshold || !sorted) {
      index =  values.indexOf(key)
    } else {
      index = lowerBound(values, key)
    }
    return index < 0 ? index : index + range.start.row
  }

  private computeListOfValuesInRange(range: AbsoluteCellRange): CellValue[] {
    const values: CellValue[] = []
    for (const cellFromRange of range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      values.push(value)
    }

    return values
  }
}
