import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching, Ast} from '../parser'
import {TransformCellRangeFunction, fixFormulaVertexRow, transformCellRangeByReferences, transformAddressesInFormula, TransformCellAddressFunction} from './common'
import {RowsSpan} from '../RowsSpan'

export namespace RemoveRowsDependencyTransformer {
  export function transform(removedRows: RowsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transform2(removedRows, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(removedRows: RowsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(removedRows)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences2(removedRows, transformCellAddressFn))
    return [newAst, fixFormulaVertexRow(nodeAddress, removedRows.sheet, removedRows.rowStart, -removedRows.numberOfRows)]
  }

  export const transformCellRangeByReferences2 = (removedRows: RowsSpan, transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      let actualStart = dependencyRangeStart
      let actualEnd = dependencyRangeEnd

      if (removedRows.sheet === dependencyRangeStart.sheet) {
        const dependencyRangeStartSCA = dependencyRangeStart.toSimpleCellAddress(address)
        const dependencyRangeEndSCA = dependencyRangeEnd.toSimpleCellAddress(address)

        if (removedRows.rowStart <= dependencyRangeStartSCA.row && removedRows.rowEnd >= dependencyRangeEndSCA.row) {
          return ErrorType.REF
        }

        if (dependencyRangeStartSCA.row >= removedRows.rowStart && dependencyRangeStartSCA.row <= removedRows.rowEnd) {
          actualStart = dependencyRangeStart.shiftedByRows(removedRows.rowEnd - dependencyRangeStartSCA.row + 1)
        }

        if (dependencyRangeEndSCA.row >= removedRows.rowStart && dependencyRangeEndSCA.row <= removedRows.rowEnd) {
          actualEnd = dependencyRangeEnd.shiftedByRows(-(dependencyRangeEndSCA.row - removedRows.rowStart + 1))
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

  export function transformDependencies(removedRows: RowsSpan): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== removedRows.sheet)) {
        return false
      }

      if (dependencyAddress.isRowAbsolute()) {
        if (removedRows.sheet !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.row < removedRows.rowStart) { // Aa
          return false
        } else if (dependencyAddress.row >= removedRows.rowStart + removedRows.numberOfRows) { // Ab
          return dependencyAddress.shiftedByRows(-removedRows.numberOfRows)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.row < removedRows.rowStart) {
          if (formulaAddress.row < removedRows.rowStart) {  // Raa
            return false
          } else if (formulaAddress.row >= removedRows.rowStart + removedRows.numberOfRows) { // Rab
            return dependencyAddress.shiftedByRows(removedRows.numberOfRows)
          }
        } else if (absolutizedDependencyAddress.row >= removedRows.rowStart + removedRows.numberOfRows) {
          if (formulaAddress.row < removedRows.rowStart) {  // Rba
            return dependencyAddress.shiftedByRows(-removedRows.numberOfRows)
          } else if (formulaAddress.row >= removedRows.rowStart + removedRows.numberOfRows) { // Rbb
            return false
          }
        }
      }

      return ErrorType.REF
    }
  }
}
