import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {MatrixVertex} from '../DependencyGraph'
import {Ast, AstNodeType, buildCellErrorAst, CellAddress} from '../parser'

export type TransformCellAddressFunction = (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => CellAddress | ErrorType.REF | false

export type TransformCellRangeFunction = (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, formulaAddress: SimpleCellAddress) => [CellAddress, CellAddress] | ErrorType.REF | false

export const transformCellRangeByReferences = (transformCellAddressFn: TransformCellAddressFunction): TransformCellRangeFunction => {
  return (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, address: SimpleCellAddress): ([CellAddress, CellAddress] | ErrorType.REF | false) => {
    const newStart = transformCellAddressFn(dependencyRangeStart, address)
    const newEnd = transformCellAddressFn(dependencyRangeEnd, address)
    if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      return ErrorType.REF
    } else if (newStart || newEnd) {
      return [newStart || dependencyRangeStart, newEnd || dependencyRangeEnd]
    } else {
      return false
    }
  }
}

export function transformAddressesInFormula(ast: Ast, address: SimpleCellAddress, transformCellAddressFn: TransformCellAddressFunction, transformCellRangeFn: TransformCellRangeFunction): Ast {
  switch (ast.type) {
    case AstNodeType.CELL_REFERENCE: {
      const newCellAddress = transformCellAddressFn(ast.reference, address)
      if (newCellAddress instanceof CellAddress) {
        return {...ast, reference: newCellAddress}
      } else if (newCellAddress === ErrorType.REF) {
        return buildCellErrorAst(new CellError(ErrorType.REF))
      } else {
        return ast
      }
    }
    case AstNodeType.CELL_RANGE: {
      const newRange = transformCellRangeFn(ast.start, ast.end, address)
      if (Array.isArray(newRange)) {
        return { ...ast, start: newRange[0], end: newRange[1] }
      } else if (newRange === ErrorType.REF) {
        return buildCellErrorAst(new CellError(ErrorType.REF))
      } else {
        return ast
      }
    }
    case AstNodeType.ERROR:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING: {
      return ast
    }
    case AstNodeType.MINUS_UNARY_OP: {
      return {
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn),
      }
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => transformAddressesInFormula(arg, address, transformCellAddressFn, transformCellRangeFn)),
      }
    }
    default: {
      return {
        type: ast.type,
        left: transformAddressesInFormula(ast.left, address, transformCellAddressFn, transformCellRangeFn),
        right: transformAddressesInFormula(ast.right, address, transformCellAddressFn, transformCellRangeFn),
      } as Ast
    }
  }
}

export function fixFormulaVertexRow(node: MatrixVertex, row: number, numberOfRows: number) {
  const nodeAddress = node.cellAddress
  if (row <= nodeAddress.row) {
    node.setAddress({
      ...nodeAddress,
      row: nodeAddress.row + numberOfRows,
    })
  }
}

export function fixFormulaVertexColumn(node: MatrixVertex, column: number, numberOfColumns: number) {
  const nodeAddress = node.cellAddress
  if (column <= nodeAddress.col) {
    node.setAddress({
      ...nodeAddress,
      col: nodeAddress.col + numberOfColumns,
    })
  }
}
