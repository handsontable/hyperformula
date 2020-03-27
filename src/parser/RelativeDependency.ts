import {CellAddress} from './'
import {ColumnAddress} from './ColumnAddress'

export type RangeDependency = CellRangeDependency | ColumnRangeDependency
export type RelativeDependency = AddressDependency | RangeDependency

export enum RelativeDependencyType {
  CellAddress,
  CellRange,
  ColumnRange
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