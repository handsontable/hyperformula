/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellAddress} from './'
import {ColumnAddress} from './ColumnAddress'
import {RowAddress} from './RowAddress'

export type RangeDependency = CellRangeDependency | ColumnRangeDependency | RowRangeDependency
export type RelativeDependency = AddressDependency | RangeDependency

export class AddressDependency {
  constructor(
    public readonly dependency: CellAddress
  ) {
  }
}

export class CellRangeDependency {
  constructor(
    public readonly start: CellAddress,
    public readonly end: CellAddress,
  ) {
  }
}

export class ColumnRangeDependency {
  constructor(
    public readonly start: ColumnAddress,
    public readonly end: ColumnAddress,
  ) {
  }
}

export class RowRangeDependency {
  constructor(
    public readonly start: RowAddress,
    public readonly end: RowAddress,
  ) {
  }
}
