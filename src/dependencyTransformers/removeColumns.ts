import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {CellAddress, ParserWithCaching, Ast} from '../parser'
import {TransformCellRangeFunction, fixFormulaVertexColumn, transformCellRangeByReferences, transformAddressesInFormula, TransformCellAddressFunction} from './common'
import {ColumnsSpan} from '../ColumnsSpan'

export namespace RemoveColumnsDependencyTransformer {
  export function transform(columnsSpan: ColumnsSpan, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      const [newAst, newAddress] = transform2(columnsSpan, node.getFormula()!, node.getAddress())
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  export function transform2(columnsSpan: ColumnsSpan, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const transformCellAddressFn = transformDependencies(columnsSpan)
    const newAst = transformAddressesInFormula(ast, nodeAddress, transformCellAddressFn, transformCellRangeByReferences2(columnsSpan, transformCellAddressFn))
    return [newAst, fixFormulaVertexColumn(nodeAddress, columnsSpan.sheet, columnsSpan.columnStart, -columnsSpan.numberOfColumns)]
  }

  export const transformCellRangeByReferences2 = (columnsSpan: ColumnsSpan, transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
    return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
      let actualStart = dependencyRangeStart
      let actualEnd = dependencyRangeEnd

      if (columnsSpan.sheet === dependencyRangeStart.sheet) {
        const dependencyRangeStartSCA = dependencyRangeStart.toSimpleCellAddress(address)
        const dependencyRangeEndSCA = dependencyRangeEnd.toSimpleCellAddress(address)

        if (columnsSpan.columnStart <= dependencyRangeStartSCA.col && columnsSpan.columnEnd >= dependencyRangeEndSCA.col) {
          return ErrorType.REF
        }

        if (dependencyRangeStartSCA.col >= columnsSpan.columnStart && dependencyRangeStartSCA.col <= columnsSpan.columnEnd) {
          actualStart = dependencyRangeStart.shiftedByColumns(columnsSpan.columnEnd - dependencyRangeStartSCA.col + 1)
        }

        if (dependencyRangeEndSCA.col >= columnsSpan.columnStart && dependencyRangeEndSCA.col <= columnsSpan.columnEnd) {
          actualEnd = dependencyRangeEnd.shiftedByColumns(-(dependencyRangeEndSCA.col - columnsSpan.columnStart + 1))
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

  export function transformDependencies(columnsSpan: ColumnsSpan): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      if ((dependencyAddress.sheet === formulaAddress.sheet)
          && (formulaAddress.sheet !== columnsSpan.sheet)) {
        return false
      }

      if (dependencyAddress.isColumnAbsolute()) {
        if (columnsSpan.sheet !== dependencyAddress.sheet) {
          return false
        }

        if (dependencyAddress.col < columnsSpan.columnStart) { // Aa
          return false
        } else if (dependencyAddress.col >= columnsSpan.columnStart + columnsSpan.numberOfColumns) { // Ab
          return dependencyAddress.shiftedByColumns(-columnsSpan.numberOfColumns)
        }
      } else {
        const absolutizedDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)
        if (absolutizedDependencyAddress.col < columnsSpan.columnStart) {
          if (formulaAddress.col < columnsSpan.columnStart) {  // Raa
            return false
          } else if (formulaAddress.col >= columnsSpan.columnStart + columnsSpan.numberOfColumns) { // Rab
            return dependencyAddress.shiftedByColumns(columnsSpan.numberOfColumns)
          }
        } else if (absolutizedDependencyAddress.col >= columnsSpan.columnStart + columnsSpan.numberOfColumns) {
          if (formulaAddress.col < columnsSpan.columnStart) {  // Rba
            return dependencyAddress.shiftedByColumns(-columnsSpan.numberOfColumns)
          } else if (formulaAddress.col >= columnsSpan.columnStart + columnsSpan.numberOfColumns) { // Rbb
            return false
          }
        }
      }

      return ErrorType.REF
    }
  }
}
