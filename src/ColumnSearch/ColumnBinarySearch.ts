import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {InternalCellValue, SimpleCellAddress} from '../Cell'
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
  public add(value: InternalCellValue | Matrix, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove(value: InternalCellValue | Matrix | null, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public change(oldValue: InternalCellValue | Matrix | null, newValue: InternalCellValue | Matrix, address: SimpleCellAddress): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeColumns(columnsSpan: ColumnsSpan): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeSheet(sheetId: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public moveValues(sourceRange: IterableIterator<[InternalCellValue, SimpleCellAddress]>, toRight: number, toBottom: number, toSheet: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public removeValues(range: IterableIterator<[InternalCellValue, SimpleCellAddress]>): void {}

  public destroy(): void {}

  public find(key: InternalCellValue, range: AbsoluteCellRange, sorted: boolean): number {
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
    for (const cellFromRange of range.addresses(this.dependencyGraph)) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      values.push(value)
    }

    return values
  }
}
