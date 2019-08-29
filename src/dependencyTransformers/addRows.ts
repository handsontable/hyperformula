import {SimpleCellAddress} from '../Cell'
import {FormulaCellVertex, MatrixVertex, DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexRow, transformAddressesInFormula, transformCellRangeByReferences, TransformCellAddressFunction} from './common'

export namespace AddRowsDependencyTransformer {
  export function transform(sheet: number, row: number, numberOfRowsToAdd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transform2(sheet, row, numberOfRowsToAdd, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(sheet: number, row: number, numberOfRows: number, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(sheet, row, numberOfRows)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences(transformCellAddressFn))
    return [newAst, fixFormulaVertexRow(nodeAddress, sheet, row, numberOfRows)]
  }

  export function transformDependencies(sheetInWhichWeAddRows: number, row: number, numberOfRows: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      // Case 4
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== sheetInWhichWeAddRows)) {
        return false
      }

      const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)

      // Case 3
      if ((dependencyAddress.sheet === sheetInWhichWeAddRows)
          && (formulaAddress.sheet !== sheetInWhichWeAddRows)) {
        if (row <= absolutizedDependencyAddress.row) {
          return dependencyAddress.shiftedByRows(numberOfRows)
        } else {
          return false
        }
      }

      // Case 2
      if ((formulaAddress.sheet === sheetInWhichWeAddRows)
          && (dependencyAddress.sheet !== sheetInWhichWeAddRows)) {
        if (formulaAddress.row < row) {
          return false
        }

        return dependencyAddress.shiftedByRows(-numberOfRows)
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
