/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {InterpreterValue} from './interpreter/InterpreterValue'
import {ClipboardCell} from './ClipboardOperations'

export interface CellValueChange {
  sheet: number,
  row: number,
  col: number,
  value: InterpreterValue,
  oldValue?: ClipboardCell,
}

export interface ChangeExporter<T> {
  exportChange: (arg: CellValueChange) => T | T[],
}

export type ChangeList = CellValueChange[]

export class ContentChanges {

  public static empty() {
    return new ContentChanges()
  }

  private changes: Map<SimpleCellAddress, CellValueChange> = new Map()

  public addAll(other: ContentChanges): ContentChanges {
    for (const [key, value] of other.changes.entries()) {
      this.changes.set(key, value)
    }
    return this
  }

  public addChangeWithOldValue(newValue: InterpreterValue, oldValue: ClipboardCell, address: SimpleCellAddress): void {
    this.addSingleCellValue(newValue, address, oldValue)
  }

  public addChange(newValue: InterpreterValue, address: SimpleCellAddress): void {
    this.addSingleCellValue(newValue, address)
  }

  public add(...changes: ChangeList) {
    for (const change of changes) {
      this.changes.set(simpleCellAddress(change.sheet, change.col, change.row), change)
    }
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
    return Array.from(this.changes.values())
  }

  public isEmpty(): boolean {
    return this.changes.size === 0
  }

  private addSingleCellValue(value: InterpreterValue, address: SimpleCellAddress, oldValue?: ClipboardCell) {
    this.add({
      sheet: address.sheet,
      col: address.col,
      row: address.row,
      value,
      oldValue
    })
  }
}
