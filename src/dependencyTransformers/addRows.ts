import {SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexRow, transformAddressesInFormula, transformCellRangeByReferences, TransformCellAddressFunction} from './common'

export namespace AddRowsDependencyTransformer {
  export function transform(sheet: number, row: number, numberOfRowsToAdd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodesFromSheet(sheet)) {
      const transformCellAddressFn = transformDependencies(sheet, row, numberOfRowsToAdd)
      const newAst = transformAddressesInFormula(node.getFormula()!, node.getAddress(), transformCellAddressFn, transformCellRangeByReferences(transformCellAddressFn))
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      fixFormulaVertexRow(node, row, numberOfRowsToAdd)
    }
  }

  export function transformDependencies(sheetInWhichWeAddRows: number, row: number, numberOfRows: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== sheetInWhichWeAddRows)) {
        return false
      }

      if (dependencyAddress.isRowAbsolute()) {
        if (sheetInWhichWeAddRows !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.row < row) { // Case Aa
          return false
        } else { // Case Ab
          return dependencyAddress.shiftedByRows(numberOfRows)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.row < row) {
          if (formulaAddress.row < row) { // Case Raa
            return false
          } else { // Case Rab
            return dependencyAddress.shiftedByRows(-numberOfRows)
          }
        } else {
          if (formulaAddress.row < row) { // Case Rba
            return dependencyAddress.shiftedByRows(numberOfRows)
          } else { // Case Rbb
            return false
          }
        }
      }
    }
  }
}
