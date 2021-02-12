/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {NamedExpressionDependency, RelativeDependency} from './parser'
import {AbsoluteCellRange} from './AbsoluteCellRange'

/**
 * Converts dependencies from maybe relative addressing to absolute addressing.
 *
 * @param deps - list of addresses in R0C0 format
 * @param baseAddress - base address with regard to which make a convertion
 */
export const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => dep.absolutize(baseAddress))
}

export const filterDependenciesOutOfScope = (deps: CellDependency[]) => {
  return deps.filter(dep => {
    if (dep instanceof NamedExpressionDependency) {
      return true
    }
    if (dep instanceof AbsoluteCellRange) {
      return addressInScope(dep.start) && addressInScope(dep.end)
    } else {
      return addressInScope(dep)
    }
  })
}

function addressInScope(address: SimpleCellAddress) {
  return address.col >= 0 && address.row >= 0
}
