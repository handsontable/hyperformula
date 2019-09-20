import {CellValue, SimpleCellAddress} from "../Cell";
import {AbsoluteCellRange} from "../AbsoluteCellRange";
import {ColumnsSpan} from "../ColumnsSpan";


export interface IColumnSearchStrategy {
  add(value: CellValue, address: SimpleCellAddress): void;

  remove(value: CellValue | null, address: SimpleCellAddress): void;

  change(oldValue: CellValue | null, newValue: CellValue, address: SimpleCellAddress): void;

  addColumns(columnsSpan: ColumnsSpan): void;

  removeColumns(columnsSpan: ColumnsSpan): void;

  find(key: any, range: AbsoluteCellRange): number;
}
