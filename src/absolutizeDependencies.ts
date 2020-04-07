import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {RelativeDependency} from './parser'
import {RelativeDependencyType} from './parser/RelativeDependency'

/**
 * Converts dependencies from maybe relative addressing to absolute addressing.
 *
 * @param deps - list of addresses in R0C0 format
 * @param baseAddress - base address with regard to which make a convertion
 */
export const absolutizeDependencies = (deps: RelativeDependency[], baseAddress: SimpleCellAddress): CellDependency[] => {
  return deps.map((dep) => {
    if (dep.type === RelativeDependencyType.CellRange) {
      return new AbsoluteCellRange(dep.dependency[0].toSimpleCellAddress(baseAddress), dep.dependency[1].toSimpleCellAddress(baseAddress))
    } else if (dep.type === RelativeDependencyType.ColumnRange) {
      const start = dep.dependency[0].toSimpleColumnAddress(baseAddress)
      const end = dep.dependency[1].toSimpleColumnAddress(baseAddress)
      return new AbsoluteColumnRange(start.sheet, start.col, end.col)
    } else if (dep.type === RelativeDependencyType.RowRange) {
      const start = dep.dependency[0].toSimpleRowAddress(baseAddress)
      const end = dep.dependency[1].toSimpleRowAddress(baseAddress)
      return new AbsoluteRowRange(start.sheet, start.row, end.row)
    } else {
      return dep.dependency.toSimpleCellAddress(baseAddress)
    }
  })
}
