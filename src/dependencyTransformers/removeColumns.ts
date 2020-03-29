/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {absoluteSheetReference, ErrorType, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {CellAddressTransformerFunction, CellRangeTransformerFunction, fixFormulaVertexColumn, transformAddressesInFormula} from './common'

export namespace RemoveColumnsDependencyTransformer {
  export function transform(removedColumns: ColumnsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transformSingleAst(removedColumns, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transformSingleAst(removedColumns: ColumnsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = cellAddressTransformer(removedColumns)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, cellRangeTransformer(removedColumns, transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, removedColumns.sheet, removedColumns.columnStart, -removedColumns.numberOfColumns)]
  }

  const cellRangeTransformer = (removedColumns: ColumnsSpan, transformCellAddressFn: CellAddressTransformerFunction): CellRangeTransformerFunction => {
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      const dependencyRangeStartSheet = absoluteSheetReference(dependencyRangeStart, address)

      let actualStart = dependencyRangeStart
      let actualEnd = dependencyRangeEnd

      if (removedColumns.sheet === dependencyRangeStartSheet) {
        const dependencyRangeStartSCA = dependencyRangeStart.toSimpleCellAddress(address)
        const dependencyRangeEndSCA = dependencyRangeEnd.toSimpleCellAddress(address)

        if (removedColumns.columnStart <= dependencyRangeStartSCA.col && removedColumns.columnEnd >= dependencyRangeEndSCA.col) {
          return ErrorType.REF
        }

        if (dependencyRangeStartSCA.col >= removedColumns.columnStart && dependencyRangeStartSCA.col <= removedColumns.columnEnd) {
          actualStart = dependencyRangeStart.shiftedByColumns(removedColumns.columnEnd - dependencyRangeStartSCA.col + 1)
        }

        if (dependencyRangeEndSCA.col >= removedColumns.columnStart && dependencyRangeEndSCA.col <= removedColumns.columnEnd) {
          actualEnd = dependencyRangeEnd.shiftedByColumns(-(dependencyRangeEndSCA.col - removedColumns.columnStart + 1))
        }
      }

      const newStart = transformCellAddressFn(actualStart, address)
      const newEnd = transformCellAddressFn(actualEnd, address)
      if (newStart === false && newEnd === false) {
        return [actualStart, actualEnd]
      } else if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
        throw Error('Cannot happen')
      } else {
        return [newStart || actualStart, newEnd || actualEnd]
      }
    }
  }

  function cellAddressTransformer(removedColumns: ColumnsSpan): CellAddressTransformerFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
      // Case 4
      if (removedColumns.sheet !== formulaAddress.sheet && removedColumns.sheet !== absoluteDependencySheet) {
        return false
      }

      // Case 3 -- removed column in same sheet where dependency is but formula in different
      if (removedColumns.sheet !== formulaAddress.sheet && removedColumns.sheet === absoluteDependencySheet) {
        const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absoluteDependencyAddress.col < removedColumns.columnStart) { // 3.ARa
          return false
        } else if (absoluteDependencyAddress.col > removedColumns.columnEnd) { // 3.ARb
          return dependencyAddress.shiftedByColumns(-removedColumns.numberOfColumns)
        }
      }

      // Case 2 -- removed column in same sheet where formula but dependency in different sheet
      if (removedColumns.sheet === formulaAddress.sheet && removedColumns.sheet !== absoluteDependencySheet) {
        if (dependencyAddress.isColumnAbsolute()) { // 2.A
          return false
        } else {
          if (formulaAddress.col < removedColumns.columnStart) { // 2.Ra
            return false
          } else if (formulaAddress.col > removedColumns.columnEnd) { // 2.Rb
            return dependencyAddress.shiftedByColumns(removedColumns.numberOfColumns)
          }
        }
      }

      // Case 1 -- same sheet
      if (removedColumns.sheet === formulaAddress.sheet && removedColumns.sheet === absoluteDependencySheet) {
        if (dependencyAddress.isColumnAbsolute()) {
          if (dependencyAddress.col < removedColumns.columnStart) { // 1.Aa
            return false
          } else if (dependencyAddress.col > removedColumns.columnEnd) { // 1.Ab
            return dependencyAddress.shiftedByColumns(-removedColumns.numberOfColumns)
          }
        } else {
          const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
          if (absoluteDependencyAddress.col < removedColumns.columnStart) {
            if (formulaAddress.col < removedColumns.columnStart) { // 1.Raa
              return false
            } else if (formulaAddress.col > removedColumns.columnEnd) { // 1.Rab
              return dependencyAddress.shiftedByColumns(removedColumns.numberOfColumns)
            }
          } else if (absoluteDependencyAddress.col > removedColumns.columnEnd) {
            if (formulaAddress.col < removedColumns.columnStart) { // 1.Rba
              return dependencyAddress.shiftedByColumns(-removedColumns.numberOfColumns)
            } else if (formulaAddress.col > removedColumns.columnEnd) { // 1.Rbb
              return false
            }
          }
        }
      }

      // 1.Ac, 1.Rca, 1.Rcb, 3.Ac, 3.Rca, 3.Rcb
      return ErrorType.REF
    }
  }
}
