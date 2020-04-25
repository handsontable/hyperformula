/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {RelativeDependency, AddressDependency, CellRangeDependency, ColumnRangeDependency, RowRangeDependency} from './parser'

/**
 * Converts dependencies from maybe relative addressing to absolute addressing.
 *
 * @param deps - list of addresses in R0C0 format
 * @param baseAddress - base address with regard to which make a convertion
 */
export const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => {
    if (dep instanceof CellRangeDependency) {
      return new AbsoluteCellRange(dep.start.toSimpleCellAddress(baseAddress), dep.end.toSimpleCellAddress(baseAddress))
    } else if (dep instanceof ColumnRangeDependency) {
      const start = dep.start.toSimpleColumnAddress(baseAddress)
      const end = dep.end.toSimpleColumnAddress(baseAddress)
      return new AbsoluteColumnRange(start.sheet, start.col, end.col)
    } else if (dep instanceof RowRangeDependency) {
      const start = dep.start.toSimpleRowAddress(baseAddress)
      const end = dep.end.toSimpleRowAddress(baseAddress)
      return new AbsoluteRowRange(start.sheet, start.row, end.row)
    } else {
      return dep.dependency.toSimpleCellAddress(baseAddress)
    }
  })
}
