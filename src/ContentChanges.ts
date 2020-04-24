/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalCellValue, SimpleCellAddress} from './Cell'
import {Matrix} from './Matrix'

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: InternalCellValue,
}

export interface ChangeExporter<T> {
  exportChange: (arg: CellValueChange) => T,
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

  public exportChanges<T>(exporter: ChangeExporter<T>): T[] {
    const ret: T[] = []
    this.changes.forEach((e, i) => {
      ret[i] = exporter.exportChange(this.changes[i])
    })
    return ret
  }

  public getChanges(): ChangeList {
    return this.changes
  }

  public isEmpty(): boolean {
    return this.changes === []
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
