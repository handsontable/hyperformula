import {SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexColumn, transformAddressesInFormula, TransformCellAddressFunction} from './common'

export namespace AddColumnsDependencyTransformer {
  export function transform(sheet: number, col: number, numberOfCols: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.formulaNodesFromSheet(sheet)) {
      const newAst = transformAddressesInFormula(node.getFormula(), node.getAddress(), transformDependencies(sheet, col, numberOfCols))
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      fixFormulaVertexColumn(node, col, numberOfCols)
    }
  }

  function transformDependencies(sheetInWhichWeAddColumns: number, column: number, numberOfColumns: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet) && (formulaAddress.sheet !== sheetInWhichWeAddColumns)) {
        return false
      }

      if (dependencyAddress.isColumnAbsolute()) {
        if (sheetInWhichWeAddColumns !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.col < column) { // Case Aa
          return false
        } else { // Case Ab
          return dependencyAddress.shiftedByColumns(numberOfColumns)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.col < column) {
          if (formulaAddress.col < column) { // Case Raa
            return false
          } else { // Case Rab
            return dependencyAddress.shiftedByColumns(-numberOfColumns)
          }
        } else {
          if (formulaAddress.col < column) { // Case Rba
            return dependencyAddress.shiftedByColumns(numberOfColumns)
          } else { // Case Rbb
            return false
          }
        }
      }
    }
  }
}
