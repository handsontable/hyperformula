import {absoluteSheetReference, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {RowsSpan} from '../RowsSpan'
import {CellAddressTransformerFunction, cellRangeTransformer, fixFormulaVertexRow, transformAddressesInFormula} from './common'

export namespace AddRowsDependencyTransformer {
  export function transform(addedRows: RowsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transformSingleAst(addedRows, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transformSingleAst(addedRows: RowsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = cellAddressTransformer(addedRows)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, cellRangeTransformer(transformCellAddressFn))
    return [newAst, fixFormulaVertexRow(nodeAddress, addedRows.sheet, addedRows.rowStart, addedRows.numberOfRows)]
  }

  function cellAddressTransformer(addedRows: RowsSpan): CellAddressTransformerFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      const absoluteDependencySheet = absoluteSheetReference(dependencyAddress, formulaAddress)
      // Case 4 and 5
      if ((absoluteDependencySheet !== addedRows.sheet)
          && (formulaAddress.sheet !== addedRows.sheet)) {
        return false
      }

      const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)

      // Case 3
      if ((absoluteDependencySheet === addedRows.sheet)
          && (formulaAddress.sheet !== addedRows.sheet)) {
        if (addedRows.rowStart <= absolutizedDependencyAddress.row) {
          return dependencyAddress.shiftedByRows(addedRows.numberOfRows)
        } else {
          return false
        }
      }

      // Case 2
      if ((formulaAddress.sheet === addedRows.sheet)
          && (absoluteDependencySheet !== addedRows.sheet)) {
        if (dependencyAddress.isRowAbsolute()) {
          return false
        }

        if (formulaAddress.row < addedRows.rowStart) {
          return false
        }

        return dependencyAddress.shiftedByRows(-addedRows.numberOfRows)
      }

      // Case 1
      if (dependencyAddress.isRowAbsolute()) {
        if (dependencyAddress.row < addedRows.rowStart) { // Case Aa
          return false
        } else { // Case Ab
          return dependencyAddress.shiftedByRows(addedRows.numberOfRows)
        }
      } else {
        if (absolutizedDependencyAddress.row < addedRows.rowStart) {
          if (formulaAddress.row < addedRows.rowStart) { // Case Raa
            return false
          } else { // Case Rab
            return dependencyAddress.shiftedByRows(-addedRows.numberOfRows)
          }
        } else {
          if (formulaAddress.row < addedRows.rowStart) { // Case Rba
            return dependencyAddress.shiftedByRows(addedRows.numberOfRows)
          } else { // Case Rbb
            return false
          }
        }
      }
    }
  }
}
