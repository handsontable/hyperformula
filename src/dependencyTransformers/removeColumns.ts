import {fixFormulaVertexColumn, transformAddressesInFormula, TransformCellAddressFunction} from "./common";
import {DependencyGraph} from "../DependencyGraph";
import {CellAddress, ParserWithCaching} from "../parser";
import {ErrorType, SimpleCellAddress} from "../Cell";

export namespace RemoveColumnsDependencyTransformer {
  export function transform(sheet: number, columnStart: number, columnEnd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    const numberOfColumnsToDelete = columnEnd - columnStart + 1
    for (const node of graph.formulaNodesFromSheet(sheet)) {
      const newAst = transformAddressesInFormula(
          node.getFormula(),
          node.getAddress(),
          transformDependencies(sheet, columnStart, numberOfColumnsToDelete),
      )
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      fixFormulaVertexColumn(node, columnStart, -numberOfColumnsToDelete)
    }
  }

  function transformDependencies(sheetInWhichWeRemoveColumns: number, leftmostColumn: number, numberOfColumns: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== sheetInWhichWeRemoveColumns)) {
        return false
      }

      if (dependencyAddress.isColumnAbsolute()) {
        if (sheetInWhichWeRemoveColumns !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.col < leftmostColumn) { // Aa
          return false
        } else if (dependencyAddress.col >= leftmostColumn + numberOfColumns) { // Ab
          return dependencyAddress.shiftedByColumns(-numberOfColumns)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.col < leftmostColumn) {
          if (formulaAddress.col < leftmostColumn) {  // Raa
            return false
          } else if (formulaAddress.col >= leftmostColumn + numberOfColumns) { // Rab
            return dependencyAddress.shiftedByColumns(numberOfColumns)
          }
        } else if (absolutizedDependencyAddress.col >= leftmostColumn + numberOfColumns) {
          if (formulaAddress.col < leftmostColumn) {  // Rba
            return dependencyAddress.shiftedByColumns(-numberOfColumns)
          } else if (formulaAddress.col >= leftmostColumn + numberOfColumns) { // Rbb
            return false
          }
        }
      }

      return ErrorType.REF
    }
  }
}
