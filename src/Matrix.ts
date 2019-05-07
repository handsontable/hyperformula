import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {Ast, AstNodeType} from './parser'

export interface MatrixSize { width: number, height: number }
export type MatrixSizeCheck = MatrixSize | false

export function checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
  if (ast.type === AstNodeType.FUNCTION_CALL) {
    switch (ast.procedureName) {
      case 'MMULT': {
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
      case 'MAXPOOL': {
        if (ast.args.length < 2) {
          return false
        }

        const matrix = checkMatrixSize(ast.args[0], formulaAddress)
        const windowArg = ast.args[1]

        if (!matrix || windowArg.type !== AstNodeType.NUMBER) {
          return false
        }

        const window = windowArg.value
        let stride = windowArg.value

        if (ast.args.length === 3) {
          const strideArg = ast.args[2]
          if (strideArg.type === AstNodeType.NUMBER) {
            stride = strideArg.value
          } else {
            return false
          }
        }

        if (window > matrix.width || window > matrix.height
            || stride > window
            || (matrix.width - window) % stride !== 0 || (matrix.height - window) % stride !== 0) {
          return false
        }

        return {
          width: 1 + (matrix.width - window) / stride,
          height: 1 + (matrix.height - window) / stride,
        }
      }
      case 'TRANSPOSE': {
        if (ast.args.length !== 1) {
          return false
        }

        const size = checkMatrixSize(ast.args[0], formulaAddress)

        return !size ? false : {
          width: size.height,
          height: size.width,
        }
      }
      default: {
        return false
      }
    }
  } else if (ast.type === AstNodeType.CELL_RANGE) {
    const range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
    return { width: range.width(), height: range.height() }
  } else if (ast.type === AstNodeType.PLUS_OP) {
    const leftSize = checkMatrixSize(ast.left, formulaAddress)
    const rightSize = checkMatrixSize(ast.right, formulaAddress)
    if (!leftSize || !rightSize || leftSize.width !== rightSize.width || leftSize.height !== rightSize.height) {
      return false
    }
    return leftSize
  } else {
    return false
  }
}

/**
 * Checks if list of addresses form a rectangle
 * */
export function checkIfMatrix(addresses: SimpleCellAddress[]): MatrixSizeCheck {
  // addresses sorted in parsing order, we are assuming that
  // topleft is always first
  // bottomright is always last
  const first = addresses[0]
  const last = addresses[addresses.length - 1]
  const possibleMatrixSize = (last.col - first.col + 1) * (last.row - first.row + 1)

  if (addresses.length !== possibleMatrixSize) {
    return false
  }

  for (let i = 0; i < addresses.length; ++i) {
    const address = addresses[i]
    if (address.col > last.col || address.col < first.col) {
      return false
    }
  }

  return {
    width: last.col - first.col + 1,
    height: last.row - first.row + 1,
  }
}

export class Matrix {
  private matrix: number[][]
  private size: MatrixSize

  constructor(matrix: number[][]) {
    this.matrix = []
    this.size = {
      height: matrix.length,
      width: matrix.length > 0 ? matrix[0].length : 0,
    }
    this.matrix = matrix
  }

  public alignWithWindow(windowSize: number): Matrix {
    const additionalHeight = windowSize > this.size.height ? windowSize - this.size.height : this.size.height % windowSize
    const additionalWidth = windowSize > this.size.width ? windowSize - this.size.width : this.size.width % windowSize
    const newWidth = this.size.width + additionalWidth
    const newHeight = this.size.height + additionalHeight

    const result: number[][] = []
    for (let y = 0; y < this.size.height; ++y) {
      const row = [...this.matrix[y]]
      for (let x = 0; x < additionalWidth; ++x) {
        row.push(0)
      }
      result.push(row)
    }

    for (let y = 0; y < additionalHeight; ++y) {
      const zeros = Array(newWidth)
      zeros.fill(0)
      result.push(zeros)
    }

    return new Matrix(result)
  }

  public get(col: number, row: number): number {
    if (col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1) {
      throw Error('Matrix index out of bound')
    }
    return this.matrix[row][col]
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  public raw(): number[][] {
    return this.matrix
  }
}
