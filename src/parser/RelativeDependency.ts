/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {CellAddress} from './'
import {ColumnAddress} from './ColumnAddress'
import {RowAddress} from './RowAddress'
import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../AbsoluteCellRange'

export type RangeDependency = CellRangeDependency | ColumnRangeDependency | RowRangeDependency
export type RelativeDependency = AddressDependency | RangeDependency | NamedExpressionDependency

export class AddressDependency {
  constructor(
    public readonly dependency: CellAddress
  ) {
  }

  public absolutize(baseAddress: SimpleCellAddress) {
    return this.dependency.toSimpleCellAddress(baseAddress)
  }
}

export class CellRangeDependency {
  constructor(
    public readonly start: CellAddress,
    public readonly end: CellAddress,
  ) {
  }

  public absolutize(baseAddress: SimpleCellAddress) {
    return new AbsoluteCellRange(
      this.start.toSimpleCellAddress(baseAddress),
      this.end.toSimpleCellAddress(baseAddress)
    )
  }
}

export class ColumnRangeDependency {
  constructor(
    public readonly start: ColumnAddress,
    public readonly end: ColumnAddress,
  ) {
  }

  public absolutize(baseAddress: SimpleCellAddress) {
    const start = this.start.toSimpleColumnAddress(baseAddress)
    const end = this.end.toSimpleColumnAddress(baseAddress)
    return new AbsoluteColumnRange(start.sheet, start.col, end.col)
  }
}

export class RowRangeDependency {
  constructor(
    public readonly start: RowAddress,
    public readonly end: RowAddress,
  ) {
  }

  public absolutize(baseAddress: SimpleCellAddress) {
    const start = this.start.toSimpleRowAddress(baseAddress)
    const end = this.end.toSimpleRowAddress(baseAddress)
    return new AbsoluteRowRange(start.sheet, start.row, end.row)
  }
}

export class NamedExpressionDependency {
  constructor(
    public readonly name: string
  ) {
  }

  public absolutize(_baseAddress: SimpleCellAddress) {
    return this
  }
}
