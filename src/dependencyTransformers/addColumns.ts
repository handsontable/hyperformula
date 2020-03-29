/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {absoluteSheetReference, SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {CellAddressTransformerFunction, cellRangeTransformer, fixFormulaVertexColumn, transformAddressesInFormula} from './common'

export namespace AddColumnsDependencyTransformer {
  export function transform(addedColumns: ColumnsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transformSingleAst(addedColumns, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transformSingleAst(addedColumns: ColumnsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = cellAddressTransformer(addedColumns)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, cellRangeTransformer(transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)]
  }

  function cellAddressTransformer(addedColumns: ColumnsSpan): CellAddressTransformerFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
      // Case 4 and 5
      if ((absoluteDependencySheet !== addedColumns.sheet)
        && (formulaAddress.sheet !== addedColumns.sheet)) {
        return false
      }

      const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)

      // Case 3
      if ((absoluteDependencySheet === addedColumns.sheet)
        && (formulaAddress.sheet !== addedColumns.sheet)) {
        if (addedColumns.columnStart <= absolutizedDependencyAddress.col) {
          return dependencyAddress.shiftedByColumns(addedColumns.numberOfColumns)
        } else {
          return false
        }
      }

      // Case 2
      if ((formulaAddress.sheet === addedColumns.sheet)
          && (absoluteDependencySheet !== addedColumns.sheet)) {
        if (dependencyAddress.isColumnAbsolute()) {
          return false
        }

        if (formulaAddress.col < addedColumns.columnStart) {
          return false
        }

        return dependencyAddress.shiftedByColumns(-addedColumns.numberOfColumns)
      }

      // Case 1
      if (dependencyAddress.isColumnAbsolute()) {
        if (dependencyAddress.col < addedColumns.columnStart) { // Case Aa
          return false
        } else { // Case Ab
          return dependencyAddress.shiftedByColumns(addedColumns.numberOfColumns)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.col < addedColumns.columnStart) {
          if (formulaAddress.col < addedColumns.columnStart) { // Case Raa
            return false
          } else { // Case Rab
            return dependencyAddress.shiftedByColumns(-addedColumns.numberOfColumns)
          }
        } else {
          if (formulaAddress.col < addedColumns.columnStart) { // Case Rba
            return dependencyAddress.shiftedByColumns(addedColumns.numberOfColumns)
          } else { // Case Rbb
            return false
          }
        }
      }
    }
  }
}
