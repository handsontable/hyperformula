import {IColumnSearchStrategy} from "./ColumnSearchStrategy";
import {CellValue, SimpleCellAddress} from "../Cell";
import {ColumnsSpan} from "../ColumnsSpan";
import {AbsoluteCellRange} from "../AbsoluteCellRange";
import {DependencyGraph} from "../DependencyGraph";
import {Config} from "../Config";
import {lowerBound} from "../interpreter/binarySearch";

export class ColumnBinarySearch implements IColumnSearchStrategy {
  constructor (
      private dependencyGraph: DependencyGraph,
      private config: Config
  ) {}

  add(value: CellValue, address: SimpleCellAddress): void {}

  remove(value: CellValue | null, address: SimpleCellAddress): void {}

  change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress): void {}

  addColumns(columnsSpan: ColumnsSpan): void {}

  removeColumns(columnsSpan: ColumnsSpan): void {}

  find(key: any, range: AbsoluteCellRange, sorted: boolean): number {
    const values = this.computeListOfValuesInRange(range)
    if (values.length < this.config.vlookupThreshold || !sorted) {
      return values.indexOf(key)
    } else {
      return lowerBound(values, key)
    }
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
