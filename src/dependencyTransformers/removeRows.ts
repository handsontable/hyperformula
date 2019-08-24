import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching, Ast} from '../parser'
import {TransformCellRangeFunction, fixFormulaVertexRow, transformCellRangeByReferences, transformAddressesInFormula, TransformCellAddressFunction} from './common'

export namespace RemoveRowsDependencyTransformer {
  export function transform(sheet: number, rowStart: number, rowEnd: number, graph: DependencyGraph, parser: ParserWithCaching) {
    const numberOfRows = rowEnd - rowStart + 1
    for (const node of graph.matrixFormulaNodesFromSheet(sheet)) {
      const [newAst, newAddress] = transform2(sheet, rowStart, numberOfRows, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(sheet: number, row: number, numberOfRows: number, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(sheet, row, numberOfRows)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences2(sheet, row, numberOfRows, transformCellAddressFn))
    return [newAst, fixFormulaVertexRow(nodeAddress, row, -numberOfRows)]
  }

  export const transformCellRangeByReferences2 = (sheet: number, row: number, numberOfRows: number, transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
    const rowEnd = row + numberOfRows - 1
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      let actualStart = dependencyRangeStart
      let actualEnd = dependencyRangeEnd

      if (sheet === dependencyRangeStart.sheet) {
        const dependencyRangeStartSCA = dependencyRangeStart.toSimpleCellAddress(address)
        const dependencyRangeEndSCA = dependencyRangeEnd.toSimpleCellAddress(address)

        if (row <= dependencyRangeStartSCA.row && rowEnd >= dependencyRangeEndSCA.row) {
          return ErrorType.REF
        }

        if (dependencyRangeStartSCA.row >= row && dependencyRangeStartSCA.row <= rowEnd) {
          actualStart = dependencyRangeStart.shiftedByRows(rowEnd - dependencyRangeStartSCA.row + 1)
        }

        if (dependencyRangeEndSCA.row >= row && dependencyRangeEndSCA.row <= rowEnd) {
          actualEnd = dependencyRangeEnd.shiftedByRows(-(dependencyRangeEndSCA.row - row + 1))
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

  export function transformDependencies(sheetInWhichWeRemoveRows: number, topRow: number, numberOfRows: number): TransformCellAddressFunction {
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
