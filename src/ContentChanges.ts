import {InternalCellValue, SimpleCellAddress} from './Cell'
import {CellValueExporter} from './CellValue'
import {Config} from './Config'
import {Matrix} from './Matrix'

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: InternalCellValue,
}

export class ContentChanges {

  public static empty() {
    return new ContentChanges()
  }

  private changes: CellValueChange[] = []

  public addAll(other: ContentChanges): ContentChanges {
    this.changes.push(...other.changes)
    return this
  }

  public addMatrixChange(newValue: Matrix, address: SimpleCellAddress): void {
    for (const [matrixValue, cellAddress] of newValue.generateValues(address)) {
      this.addSingleCellValue(matrixValue, cellAddress)
    }
  }

  public addChange(newValue: InternalCellValue, address: SimpleCellAddress): void {
    this.addSingleCellValue(newValue, address)
  }

  public add(...change: CellValueChange[]) {
    this.changes.push(...change)
  }

  public exportChanges(exporter: CellValueExporter): CellValueChange[] {
    let ret: CellValueChange[] = []
    for (let i in this.changes) {
      ret[i] = {
        sheet: this.changes[i].sheet,
        col: this.changes[i].col,
        row: this.changes[i].row,
        value: exporter.export(this.changes[i].value)
      }
    }
    return ret
  }

  public getChanges(): CellValueChange[] {
    return this.changes
  }

  private addSingleCellValue(value: InternalCellValue, address: SimpleCellAddress) {
    this.add({
      sheet: address.sheet,
      col: address.col,
      row: address.row,
      value,
    })
  }
}
