import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {rangeLowerBound} from '../interpreter/binarySearch'
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
    let index = -1
    if (range.height() < this.config.vlookupThreshold || !sorted) {
      const values = this.computeListOfValuesInRange(range)
      index =  values.indexOf(key)
    } else {
      index = rangeLowerBound(range, key, this.dependencyGraph)
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
