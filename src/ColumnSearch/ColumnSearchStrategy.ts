import {CellValue, SimpleCellAddress} from "../Cell";
import {AbsoluteCellRange} from "../AbsoluteCellRange";
import {ColumnsSpan} from "../ColumnsSpan";
import {Config} from "../Config";
import {DependencyGraph} from "../DependencyGraph";
import {ColumnIndex} from "./ColumnIndex";
import {Statistics} from "../statistics/Statistics";
import {ColumnBinarySearch} from "./ColumnBinarySearch";


export interface IColumnSearchStrategy {
  add(value: CellValue, address: SimpleCellAddress): void;

  remove(value: CellValue | null, address: SimpleCellAddress): void;

  change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress): void;

  addColumns(columnsSpan: ColumnsSpan): void;

  removeColumns(columnsSpan: ColumnsSpan): void;

  find(key: any, range: AbsoluteCellRange, sorted: boolean): number;
}

export function buildColumnSearchStrategy(dependencyGraph: DependencyGraph, config: Config, statistics: Statistics): IColumnSearchStrategy {
  if (config.useColumnIndex) {
    return new ColumnIndex(statistics, dependencyGraph.lazilyTransformingAstService)
  } else {
    return new ColumnBinarySearch(dependencyGraph, config)
  }
}
