import {SimpleCellAddress} from '../Cell'
import {FormulaCellVertex, MatrixVertex, DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexColumn, transformAddressesInFormula, transformCellRangeByReferences, TransformCellAddressFunction} from './common'

export namespace AddColumnsDependencyTransformer {
  export function transform(sheet: number, col: number, numberOfCols: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transform2(sheet, col, numberOfCols, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(sheet: number, col: number, numberOfCols: number, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(sheet, col, numberOfCols)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences(transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, col, numberOfCols)]
  }

  export function transformDependencies(sheetInWhichWeAddColumns: number, column: number, numberOfColumns: number): TransformCellAddressFunction {
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
