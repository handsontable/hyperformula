/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellAddress} from './'
import {ColumnAddress} from './ColumnAddress'
import {RowAddress} from './RowAddress'

export type RangeDependency = CellRangeDependency | ColumnRangeDependency | RowRangeDependency
export type RelativeDependency = AddressDependency | RangeDependency

export enum RelativeDependencyType {
  CellAddress,
  CellRange,
  ColumnRange,
  RowRange,
}

export interface AddressDependency {
  type: RelativeDependencyType.CellAddress,
  dependency: CellAddress,
}

export interface CellRangeDependency {
  type: RelativeDependencyType.CellRange,
  dependency: [CellAddress, CellAddress],
}

export interface ColumnRangeDependency {
  type: RelativeDependencyType.ColumnRange,
  dependency: [ColumnAddress, ColumnAddress],
}

export interface RowRangeDependency {
  type: RelativeDependencyType.RowRange,
  dependency: [RowAddress, RowAddress],
}
