import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexRow, transformAddressesInFormula, TransformCellAddressFunction} from './common'

export namespace RemoveRowsDependencyTransformer {
  export function transform(sheet: number, rowStart: number, rowEnd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    const numberOfRowsToDelete = rowEnd - rowStart + 1
    for (const node of graph.formulaNodesFromSheet(sheet)) {
      const newAst = transformAddressesInFormula(
          node.getFormula(),
          node.getAddress(),
          transformDependencies(sheet, rowStart, numberOfRowsToDelete),
      )
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      fixFormulaVertexRow(node, rowStart, -numberOfRowsToDelete)
    }
  }

  function transformDependencies(sheetInWhichWeRemoveRows: number, topRow: number, numberOfRows: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== sheetInWhichWeRemoveRows)) {
        return false
      }

      if (dependencyAddress.isRowAbsolute()) {
        if (sheetInWhichWeRemoveRows !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.row < topRow) { // Aa
          return false
        } else if (dependencyAddress.row >= topRow + numberOfRows) { // Ab
          return dependencyAddress.shiftedByRows(-numberOfRows)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.row < topRow) {
          if (formulaAddress.row < topRow) {  // Raa
            return false
          } else if (formulaAddress.row >= topRow + numberOfRows) { // Rab
            return dependencyAddress.shiftedByRows(numberOfRows)
          }
        } else if (absolutizedDependencyAddress.row >= topRow + numberOfRows) {
          if (formulaAddress.row < topRow) {  // Rba
            return dependencyAddress.shiftedByRows(-numberOfRows)
          } else if (formulaAddress.row >= topRow + numberOfRows) { // Rbb
            return false
          }
        }
      }

      return ErrorType.REF
    }
  }
}
