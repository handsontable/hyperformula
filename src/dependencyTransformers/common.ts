import {Ast, AstNodeType, buildCellErrorAst, CellAddress} from "../parser";
import {CellError, ErrorType, SimpleCellAddress} from "../Cell";
import {FormulaCellVertex} from "../DependencyGraph";

export type TransformCellAddressFunction = (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => CellAddress | ErrorType.REF | false

export function transformAddressesInFormula(ast: Ast, address: SimpleCellAddress, transformCellAddressFn: TransformCellAddressFunction): Ast {
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
      const newStart = transformCellAddressFn(ast.start, address)
      const newEnd = transformCellAddressFn(ast.end, address)
      if (newStart === ErrorType.REF) {
        return buildCellErrorAst(new CellError(ErrorType.REF))
      }
      if (newEnd === ErrorType.REF) {
        return buildCellErrorAst(new CellError(ErrorType.REF))
      }
      if (newStart || newEnd) {
        return {
          ...ast,
          start: newStart || ast.start,
          end: newEnd || ast.end,
        }
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
        value: transformAddressesInFormula(ast.value, address, transformCellAddressFn),
      }
    }
    case AstNodeType.FUNCTION_CALL: {
      return {
        type: ast.type,
        procedureName: ast.procedureName,
        args: ast.args.map((arg) => transformAddressesInFormula(arg, address, transformCellAddressFn)),
      }
    }
    default: {
      return {
        type: ast.type,
        left: transformAddressesInFormula(ast.left, address, transformCellAddressFn),
        right: transformAddressesInFormula(ast.right, address, transformCellAddressFn),
      } as Ast
    }
  }
}

export function fixFormulaVertexRow(node: FormulaCellVertex, row: number, numberOfRows: number) {
  const nodeAddress = node.getAddress()
  if (row <= nodeAddress.row) {
    node.setAddress({
      ...nodeAddress,
      row: nodeAddress.row + numberOfRows,
    })
  }
}


export function fixFormulaVertexColumn(node: FormulaCellVertex, column: number, numberOfColumns: number) {
  const nodeAddress = node.getAddress()
  if (column <= nodeAddress.col) {
    node.setAddress({
      ...nodeAddress,
      col: nodeAddress.col + numberOfColumns,
    })
  }
}
