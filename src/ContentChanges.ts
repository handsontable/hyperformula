/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {InterpreterValue} from './interpreter/InterpreterValue'

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: InterpreterValue,
}

export interface ChangeExporter<T> {
  exportChange: (arg: CellValueChange) => T | T[],
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

  public addChange(newValue: InterpreterValue, address: SimpleCellAddress): void {
    this.addSingleCellValue(newValue, address)
  }

  public add(...change: ChangeList) {
    this.changes.push(...change)
  }

  public exportChanges<T>(exporter: ChangeExporter<T>): T[] {
    let ret: T[] = []
    this.changes.forEach((e) => {
      const change = exporter.exportChange(e)
      if (Array.isArray(change)) {
        ret = ret.concat(change)
      } else{
        ret.push(change)
      }
    })
    return ret
  }

  public getChanges(): ChangeList {
    return this.changes
  }

  public isEmpty(): boolean {
    return this.changes.length === 0
  }

  private addSingleCellValue(value: InterpreterValue, address: SimpleCellAddress) {
    this.add({
      sheet: address.sheet,
      col: address.col,
      row: address.row,
      value,
    })
  }
}
