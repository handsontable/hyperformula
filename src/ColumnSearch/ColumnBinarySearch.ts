import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalCellValue, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {Matrix} from '../Matrix'
import {IColumnSearchStrategy} from './ColumnSearchStrategy'

export class ColumnBinarySearch implements IColumnSearchStrategy {
  constructor(
    private dependencyGraph: DependencyGraph,
    private config: Config,
  ) {}

  public add(value: InternalCellValue | Matrix, address: SimpleCellAddress): void {}

  public remove(value: InternalCellValue | Matrix | null, address: SimpleCellAddress): void {}

  public change(oldValue: InternalCellValue | Matrix | null, newValue: InternalCellValue | Matrix, address: SimpleCellAddress): void {}

  public addColumns(columnsSpan: ColumnsSpan): void {}

  public removeColumns(columnsSpan: ColumnsSpan): void {}

  public removeSheet(sheetId: number): void {}

  public moveValues(sourceRange: IterableIterator<[InternalCellValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void {}

  public removeValues(range: IterableIterator<[InternalCellValue, SimpleCellAddress]>): void {}

  public destroy(): void {}

  public find(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    if (range.height() < this.config.vlookupThreshold || !sorted) {
      const values = this.computeListOfValuesInRange(range)
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.row
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph)
    }
  }

  private computeListOfValuesInRange(range: AbsoluteCellRange): InternalCellValue[] {
    const values: InternalCellValue[] = []
    for (const cellFromRange of range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      values.push(value)
    }

    return values
  }
}
