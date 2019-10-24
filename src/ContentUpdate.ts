import {CellValue, SimpleCellAddress} from "./Cell";
import {Matrix} from "./Matrix";

export interface CellContentUpdate {
  sheet: number,
  row: number,
  col: number,
  value: CellValue,
  oldValue: CellValue | null
}

export class ContentUpdate {
  public changes: Array<CellContentUpdate> = []

  public addChange(oldValue: CellValue | Matrix | null, newValue: CellValue | Matrix, address: SimpleCellAddress): void {
    if (newValue instanceof Matrix && oldValue instanceof Matrix) {
      for (const [matrixValue, cellAddress] of newValue.generateValues(address)) {
        this.addSingleCellValue(matrixValue, cellAddress)
      }
    } else {
      this.addSingleCellValue(newValue, address)
    }
  }

  private addSingleCellValue(value: CellValue, oldValue: CellValue, address: SimpleCellAddress) {
    this.changes.push({
      sheet: address.sheet,
      col: address.col,
      row: address.row,
      value: value,
      oldValue: null
    })
  }

  private add(change: CellContentUpdate): void {
    this.changes.push(change)
  }
}
