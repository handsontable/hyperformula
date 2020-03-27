import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {Ast, AstNodeType, buildCellErrorAst, CellAddress} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'

export type Address = CellAddress | ColumnAddress | RowAddress
export type AddressWithColumn = CellAddress | ColumnAddress
export type AddressWithRow = CellAddress | RowAddress

export type CellAddressTransformerFunction<T> = (dependencyAddress: T, formulaAddress: SimpleCellAddress) => T | ErrorType.REF | false

export type CellRangeTransformerFunction<T> = (dependencyRangeStart: T, dependencyRangeEnd: T, formulaAddress: SimpleCellAddress) => [T, T] | ErrorType.REF | false

export const cellRangeTransformer = <T>(transformCellAddressFn: CellAddressTransformerFunction<T>): CellRangeTransformerFunction<T> => {
  return (dependencyRangeStart: T, dependencyRangeEnd: T, address: SimpleCellAddress): ([T, T] | ErrorType.REF | false) => {
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

/* TODO any */
export function transformAddressesInFormula<T extends Address>(ast: Ast,
                                            address: SimpleCellAddress,
                                            transformCellAddressFn: any,
                                            transformCellRangeFn: any): Ast {
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
    case AstNodeType.COLUMN_RANGE:
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
    case AstNodeType.PERCENT_OP: {
      return {
        ...ast,
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn),
      }
    }
    case AstNodeType.MINUS_UNARY_OP: {
      return {
        ...ast,
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn),
      }
    }
    case AstNodeType.PLUS_UNARY_OP: {
      return {
        ...ast,
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn),
      }
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        ...ast,
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => transformAddressesInFormula(arg, address, transformCellAddressFn, transformCellRangeFn)),
      }
    }
    case AstNodeType.PARENTHESIS: {
      return {
        ...ast,
        type: ast.type,
        expression: transformAddressesInFormula(ast.expression, address, transformCellAddressFn, transformCellRangeFn),
      }
    }
    default: {
      return {
        ...ast,
        type: ast.type,
        left: transformAddressesInFormula(ast.left, address, transformCellAddressFn, transformCellRangeFn),
        right: transformAddressesInFormula(ast.right, address, transformCellAddressFn, transformCellRangeFn),
      } as Ast
    }
  }
}

export function fixFormulaVertexRow(nodeAddress: SimpleCellAddress, sheet: number, row: number, numberOfRows: number): SimpleCellAddress {
  if (sheet === nodeAddress.sheet && row <= nodeAddress.row) {
    return {
      ...nodeAddress,
      row: nodeAddress.row + numberOfRows,
    }
  } else {
    return nodeAddress
  }
}

export function fixFormulaVertexColumn(nodeAddress: SimpleCellAddress, sheet: number, column: number, numberOfColumns: number): SimpleCellAddress {
  if (sheet === nodeAddress.sheet && column <= nodeAddress.col) {
    return {
      ...nodeAddress,
      col: nodeAddress.col + numberOfColumns,
    }
  } else {
    return nodeAddress
  }
}
