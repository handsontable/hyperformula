import {InternalCellValue, SimpleCellAddress} from './Cell'
import {CellValueExporter} from './CellValue'
import {Matrix} from './Matrix'

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: InternalCellValue,
}

export type ChangeList = CellValueChange[]

export class ContentChanges {

  public static empty() {
    return new ContentChanges()
  }

  private changes: ChangeList = []

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

  public add(...change: ChangeList) {
    this.changes.push(...change)
  }

  public exportChanges(exporter: CellValueExporter): ChangeList {
    const ret: ChangeList = []
    this.changes.forEach((e, i) => {
      ret[i] = {
        sheet: this.changes[i].sheet,
        col: this.changes[i].col,
        row: this.changes[i].row,
        value: exporter.export(this.changes[i].value),
      }
    })
    return ret
  }

  public getChanges(): ChangeList {
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
