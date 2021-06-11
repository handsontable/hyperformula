/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {InterpreterValue} from './interpreter/InterpreterValue'
import {ClipboardCell} from './ClipboardOperations'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'

export interface CellValueChange {
  address: SimpleCellAddress,
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

  private constructor() {}

  private changes: Map<string, CellValueChange> = new Map()

  public addAll(other: ContentChanges): ContentChanges {
    for (const change of other.changes.values()) {
      this.add(change.address, change)
    }
    return this
  }

  public addChangeWithOldValue(newValue: InterpreterValue, oldValue: ClipboardCell, address: SimpleCellAddress): void {
    this.addInterpreterValue(newValue, address, oldValue)
  }

  public addChange(newValue: InterpreterValue, address: SimpleCellAddress): void {
    this.addInterpreterValue(newValue, address)
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

  private add(address: SimpleCellAddress, change: CellValueChange) {
    const value = change.value
    if (value instanceof SimpleRangeValue) {
      for (const cellAddress of value.effectiveAddressesFromData(address)) {
        this.changes.delete(`${cellAddress.sheet},${cellAddress.col},${cellAddress.row}`)
      }
    }
    this.changes.set(`${address.sheet},${address.col},${address.row}`, change)
  }

  private addInterpreterValue(value: InterpreterValue, address: SimpleCellAddress, oldValue?: ClipboardCell) {
    this.add(address, {
      address,
      value,
      oldValue
    })
  }
}
