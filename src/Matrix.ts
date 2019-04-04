import {cellRangeToSimpleCellRange, SimpleCellAddress} from './Cell'
import {Ast, AstNodeType} from './parser/Ast'

export interface MatrixSize { width: number, height: number }
export type MatrixSizeCheck = MatrixSize | false

export function checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
  if (ast.type === AstNodeType.FUNCTION_CALL) {
    switch (ast.procedureName.toLowerCase()) {
      case 'mmult': {
        if (ast.args.length !== 2) {
          return false
        }

        const left = checkMatrixSize(ast.args[0], formulaAddress)
        const right = checkMatrixSize(ast.args[1], formulaAddress)

        if (!left || !right || left.width !== right.height) {
          return false
        }

        return {
          width: right.width,
          height: left.height,
        }
      }
      default: {
        return false
      }
    }
  } else if (ast.type === AstNodeType.CELL_RANGE) {
    const range = cellRangeToSimpleCellRange(ast, formulaAddress)
    return {
      width: range.end.col - range.start.col + 1,
      height: range.end.row - range.start.row + 1,
    }
  } else {
    return false
  }
}
