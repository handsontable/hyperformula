/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {isColOrRowInvalid, SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {NamedExpressionDependency, RelativeDependency} from './parser'

/**
 * Converts dependencies from maybe relative addressing to absolute addressing.
 *
 * @param deps - list of addresses in R0C0 format
 * @param baseAddress - base address with regard to which make a convertion
 */
export const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map(dep => dep.absolutize(baseAddress))
}

export const filterDependenciesOutOfScope = (deps: CellDependency[]) => {
  return deps.filter(dep => {
    if (dep instanceof NamedExpressionDependency) {
      return true
    }
    if (dep instanceof AbsoluteCellRange) {
      return !(isColOrRowInvalid(dep.start) || isColOrRowInvalid(dep.end))
    } else {
      return !isColOrRowInvalid(dep)
    }
  })
}
