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
  return deps.map((dep) => dep.absolutize(baseAddress))
}
