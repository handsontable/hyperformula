import {cellRangeToSimpleCellRange, SimpleCellAddress} from './Cell'
import {Ast, AstNodeType} from './parser/Ast'

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
        if (ast.args.length !== 2) {
          return false
        }

        const left = checkMatrixSize(ast.args[0], formulaAddress)
        const right = ast.args[1]

        if (!left || right.type !== AstNodeType.NUMBER) {
          return false
        }

        return {
          width: left.width / right.value,
          height: left.height / right.value,
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
    const range = cellRangeToSimpleCellRange(ast, formulaAddress)
    return {
      width: range.end.col - range.start.col + 1,
      height: range.end.row - range.start.row + 1,
    }
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
      width: matrix.length > 0 ? matrix[0].length : 0
    }
    for (let y = 0; y < this.size.height; y++) {
      let row: number[]  = new Array<number>();
      row.fill(0)
      this.matrix.push(row)
    }
    this.fill(matrix)
  }

  public fill(input: number[][]) {
    for (let y = 0; y < input.length && y < this.size.height; ++y) {
      for (let x = 0; x < input[y].length && x < this.size.width; ++x) {
        this.matrix[y][x] = input[y][x]
      }
    }
  }

  public alignWithWindow(windowSize: number): Matrix {
    const additionalHeight = windowSize > this.size.height ? windowSize - this.size.height : this.size.height % windowSize
    const additionalWidth = windowSize > this.size.width ? windowSize - this.size.width : this.size.width % windowSize
    const newWidth = this.size.width + additionalWidth
    const newHeight = this.size.height + additionalHeight

    let result: number[][] = []
    for (let y = 0; y < this.size.height; ++y) {
      const row = [...this.matrix[y]]
      for (let x = 0; x < additionalWidth; ++x) {
        row.push(0)
      }
      result.push(row)
    }

    for (let y = 0; y < additionalHeight; ++y) {
      let zeros = Array(newWidth)
      zeros.fill(0)
      result.push(zeros)
    }

    return new Matrix(result)
  }

  public get(col: number, row: number): number {
    if (col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1) {
      throw Error("Matrix index out of bound")
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
