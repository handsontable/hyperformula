import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {Ast, AstNodeType, buildCellErrorAst, CellAddress} from '../parser'
import {ColumnAddress, ColumnReferenceType} from '../parser/ColumnAddress'
import {CellReferenceType} from '../parser/CellAddress'

export type CellAddressTransformerFunction = (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => CellAddress | ErrorType.REF | false

export type CellRangeTransformerFunction = (dependencyRangeStart: CellAddress, dependencyRangeEnd: CellAddress, formulaAddress: SimpleCellAddress) => [CellAddress, CellAddress] | ErrorType.REF | false

export type ColumnRangeTransformerFunction = (dependencyRangeStart: ColumnAddress, dependencyRangeEnd: ColumnAddress, formulaAddress: SimpleCellAddress) => [ColumnAddress, ColumnAddress] | ErrorType.REF | false

export const cellRangeTransformer = (transformCellAddressFn: CellAddressTransformerFunction): CellRangeTransformerFunction => {
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

export const columnRangeTransformer = (transformCellAddressFn: CellAddressTransformerFunction): ColumnRangeTransformerFunction => {
  return (dependencyRangeStart: ColumnAddress, dependencyRangeEnd: ColumnAddress, address: SimpleCellAddress): ([ColumnAddress, ColumnAddress] | ErrorType.REF | false) => {
    const start = new CellAddress(dependencyRangeStart.sheet, dependencyRangeStart.col, Number.NEGATIVE_INFINITY, CellReferenceType.CELL_REFERENCE_RELATIVE)
    const end = new CellAddress(dependencyRangeEnd.sheet, dependencyRangeEnd.col, Number.POSITIVE_INFINITY, CellReferenceType.CELL_REFERENCE_RELATIVE)
    const newStart = transformCellAddressFn(start, address)
    const newEnd = transformCellAddressFn(end, address)
    if (newStart === ErrorType.REF || newEnd === ErrorType.REF) {
      return ErrorType.REF
    } else if (newStart || newEnd) {
      let finitStart = dependencyRangeStart
      let finitEnd = dependencyRangeEnd
      if (newStart) {
        finitStart = ColumnAddress.relative(newStart.sheet, newStart.col)
      }
      if (newEnd) {
        finitEnd = ColumnAddress.relative(newEnd.sheet, newEnd.col)
      }
      return [finitStart, finitEnd]
    } else {
      return false
    }
  }
}

export function transformAddressesInFormula(ast: Ast, address: SimpleCellAddress, transformCellAddressFn: CellAddressTransformerFunction, transformCellRangeFn: CellRangeTransformerFunction, transformColumnRangeFn?: ColumnRangeTransformerFunction): Ast {
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
    case AstNodeType.COLUMN_RANGE: {
      if (transformColumnRangeFn === undefined) {
        throw Error('TODO')
      }
      const newRange = transformColumnRangeFn(ast.start, ast.end, address)
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
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
      }
    }
    case AstNodeType.MINUS_UNARY_OP: {
      return {
        ...ast,
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
      }
    }
    case AstNodeType.PLUS_UNARY_OP: {
      return {
        ...ast,
        type: ast.type,
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
      }
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        ...ast,
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => transformAddressesInFormula(arg, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn)),
      }
    }
    case AstNodeType.PARENTHESIS: {
      return {
        ...ast,
        type: ast.type,
        expression: transformAddressesInFormula(ast.expression, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
      }
    }
    default: {
      return {
        ...ast,
        type: ast.type,
        left: transformAddressesInFormula(ast.left, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
        right: transformAddressesInFormula(ast.right, address, transformCellAddressFn, transformCellRangeFn, transformColumnRangeFn),
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
