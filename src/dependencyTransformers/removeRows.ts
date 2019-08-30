import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress, ParserWithCaching} from '../parser'
import {
  fixFormulaVertexRow,
  transformAddressesInFormula,
  TransformCellAddressFunction,
  TransformCellRangeFunction
} from './common'
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
      // Case 4
      if (removedRows.sheet !== formulaAddress.sheet && removedRows.sheet !== dependencyAddress.sheet) {
        return false
      }

      // Case 3 -- removed row in same sheet where dependency is but formula in different
      if (removedRows.sheet !== formulaAddress.sheet && removedRows.sheet === dependencyAddress.sheet) {
        const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absoluteDependencyAddress.row < removedRows.rowStart) { // 3.ARa
          return false
        } else if (absoluteDependencyAddress.row > removedRows.rowEnd) { // 3.ARb
          return dependencyAddress.shiftedByRows(-removedRows.numberOfRows)
        }
      }

      // Case 2 -- removed row in same sheet where formula but dependency in different sheet
      if (removedRows.sheet === formulaAddress.sheet && removedRows.sheet !== dependencyAddress.sheet) {
        if (dependencyAddress.isRowAbsolute()) { // 2.A
          return false
        } else {
          if (formulaAddress.row < removedRows.rowStart) { // 2.Ra
            return false
          } else if (formulaAddress.row > removedRows.rowEnd) { // 2.Rb
            return dependencyAddress.shiftedByRows(removedRows.numberOfRows)
          }
        }
      }

      // Case 1 -- same sheet
      if (removedRows.sheet === formulaAddress.sheet && removedRows.sheet === dependencyAddress.sheet) {
        if (dependencyAddress.isRowAbsolute()) {
          if (dependencyAddress.row < removedRows.rowStart) { // 1.Aa
            return false
          } else if (dependencyAddress.row > removedRows.rowEnd) { // 1.Ab
            return dependencyAddress.shiftedByRows(-removedRows.numberOfRows)
          }
        } else {
          const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
          if (absoluteDependencyAddress.row < removedRows.rowStart) {
            if (formulaAddress.row < removedRows.rowStart) { // 1.Raa
              return false
            } else if (formulaAddress.row > removedRows.rowEnd) { // 1.Rab
              return dependencyAddress.shiftedByRows(removedRows.numberOfRows)
            }
          } else if (absoluteDependencyAddress.row > removedRows.rowEnd) {
            if (formulaAddress.row < removedRows.rowStart) { // 1.Rba
              return dependencyAddress.shiftedByRows(-removedRows.numberOfRows)
            } else if (formulaAddress.row > removedRows.rowEnd) { //1.Rbb
              return false
            }
          }
        }
      }

      // 1.Ac, 1.Rca, 1.Rcb, 3.Ac, 3.Rca, 3.Rcb
      return ErrorType.REF
    }
  }
}
