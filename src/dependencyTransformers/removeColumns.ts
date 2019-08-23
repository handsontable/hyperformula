import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching, Ast} from '../parser'
import {TransformCellRangeFunction, fixFormulaVertexColumn, transformCellRangeByReferences, transformAddressesInFormula, TransformCellAddressFunction} from './common'

export namespace RemoveColumnsDependencyTransformer {
  export function transform(sheet: number, columnStart: number, columnEnd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    const numberOfColumnsToDelete = columnEnd - columnStart + 1
    for (const node of graph.matrixFormulaNodesFromSheet(sheet)) {
      const [newAst, newAddress] = transform2(sheet, columnStart, numberOfColumnsToDelete, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(sheet: number, col: number, numberOfCols: number, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(sheet, col, numberOfCols)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences(transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, col, -numberOfCols)]
  }

  export const transformCellRangeByReferences = (transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      const newStart = transformCellAddressFn(dependencyRangeStart, address)
      const newEnd = transformCellAddressFn(dependencyRangeEnd, address)
      if (newStart === ErrorType.REF && newEnd === ErrorType.REF) {
        return ErrorType.REF
      } else if (newStart === false && newEnd === false) {
        return false
      } else {
        let realNewStart, realNewEnd

        if (newStart === ErrorType.REF) {
          const shifted = dependencyRangeStart.shiftedByColumns(1)
          realNewStart = (transformCellAddressFn(shifted, address) || shifted) as CellAddress
        } else {
          realNewStart = newStart || dependencyRangeStart
        }

        if (newEnd === ErrorType.REF) {
          const shifted = dependencyRangeEnd.shiftedByColumns(-1)
          realNewEnd = (transformCellAddressFn(shifted, address) || shifted) as CellAddress
        } else {
          realNewEnd = newEnd || dependencyRangeEnd
        }

        return [realNewStart, realNewEnd]
      }
    }
  }

  export function transformDependencies(sheetInWhichWeRemoveColumns: number, leftmostColumn: number, numberOfColumns: number): TransformCellAddressFunction {
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
