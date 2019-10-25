import {CellValue, SimpleCellAddress} from "./Cell";
import {Matrix} from "./Matrix";

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: CellValue,
}

export class ContentChanges {
  public changes: Array<CellValueChange> = []

  public static empty() {
    return new ContentChanges()
  }

  public addAll(other: ContentChanges): ContentChanges {
    this.changes.push(...other.changes)
    return this
  }

  public addMatrixChange(newValue: Matrix, address: SimpleCellAddress): void {
    for (const [matrixValue, cellAddress] of newValue.generateValues(address)) {
      this.addSingleCellValue(matrixValue, cellAddress)
    }
  }

  public addChange(newValue: CellValue, address: SimpleCellAddress): void {
    this.addSingleCellValue(newValue, address)
  }

  public getChanges() {
    return this.changes
  }

  private addSingleCellValue(value: CellValue, address: SimpleCellAddress) {
    this.changes.push({
      sheet: address.sheet,
      col: address.col,
      row: address.row,
      value: value,
    })
  }
}
