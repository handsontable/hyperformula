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
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences2(sheet, col, numberOfCols, transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, col, -numberOfCols)]
  }

  export const transformCellRangeByReferences2 = (sheet: number, col: number, numberOfCols: number, transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
    const columnEnd = col + numberOfCols - 1
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      let actualStart = dependencyRangeStart
      let actualEnd = dependencyRangeEnd

      if (sheet === dependencyRangeStart.sheet) {
        const dependencyRangeStartSCA = dependencyRangeStart.toSimpleCellAddress(address)
        const dependencyRangeEndSCA = dependencyRangeEnd.toSimpleCellAddress(address)

        if (col <= dependencyRangeStartSCA.col && columnEnd >= dependencyRangeEndSCA.col) {
          return ErrorType.REF
        }

        if (dependencyRangeStartSCA.col >= col && dependencyRangeStartSCA.col <= columnEnd) {
          actualStart = dependencyRangeStart.shiftedByColumns(columnEnd - dependencyRangeStartSCA.col + 1)
        }

        if (dependencyRangeEndSCA.col >= col && dependencyRangeEndSCA.col <= columnEnd) {
          actualEnd = dependencyRangeEnd.shiftedByColumns(-(dependencyRangeEndSCA.col - col + 1))
        }
      }

      const newStart = transformCellAddressFn(actualStart, address)
      const newEnd = transformCellAddressFn(actualEnd, address)
      if (newStart === false && newEnd === false) {
        return [actualStart, actualEnd]
      } else if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
        throw Error("Cannot happen")
      } else {
        return [newStart || actualStart, newEnd || actualEnd]
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
