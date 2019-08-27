import {SimpleCellAddress} from '../Cell'
import {FormulaCellVertex, MatrixVertex, DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {fixFormulaVertexColumn, transformAddressesInFormula, transformCellRangeByReferences, TransformCellAddressFunction} from './common'
import {ColumnsSpan} from '../ColumnsSpan'

export namespace AddColumnsDependencyTransformer {
  export function transform(addedColumns: ColumnsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transform2(addedColumns, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(addedColumns: ColumnsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(addedColumns)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences(transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, addedColumns.sheet, addedColumns.columnStart, addedColumns.numberOfColumns)]
  }

  export function transformDependencies(addedColumns: ColumnsSpan): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet) && (formulaAddress.sheet !== addedColumns.sheet)) {
        return false
      }

      if (dependencyAddress.isColumnAbsolute()) {
        if (addedColumns.sheet !== dependencyAddress.sheet) {
          return false
        }

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
