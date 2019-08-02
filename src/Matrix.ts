import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {Ast, AstNodeType} from './parser'

export interface Size { width: number, height: number }
export type MatrixSizeCheck = Size | false

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
      case 'MEDIANPOOL':
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
  } else if (ast.type === AstNodeType.NUMBER) {
    return { width: 1, height: 1 }
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

export interface IMatrix {
  width(): number
  height(): number
  get(col: number, row: number): number,
}

export class NotComputedMatrix implements IMatrix {
  constructor(private _width: number, private _height: number) {

  }

  public width(): number {
    return this._width
  }

  public height(): number {
    return this._height
  }

  public get(col: number, row: number): number {
    throw Error('Matrix not computed yet.')
  }
}

export class Matrix implements IMatrix {
  private readonly matrix: number[][]
  private size: Size

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

  public addRows(aboveRow: number, numberOfRows: number) {
    this.matrix.splice(aboveRow, 0, ...this.zeroArrays(numberOfRows, this.width()))
    this.size.height += numberOfRows
  }

  public addColumns(aboveColumn: number, numberOfColumns: number) {
    for (let i = 0; i < this.height(); i++) {
      this.matrix[i].splice(aboveColumn, 0, ...new Array(numberOfColumns).fill(0))
    }
    this.size.width += numberOfColumns
  }

  public removeRows(startRow: number, endRow: number) {
    if (this.outOfBound(0, startRow) || this.outOfBound(0, endRow)) {
      throw Error('Matrix index out of bound')
    }
    const numberOfRows = endRow - startRow + 1
    this.matrix.splice(startRow, numberOfRows)
    this.size.height -= numberOfRows
  }

  public removeColumns(leftmostColumn: number, rightmostColumn: number) {
    if (this.outOfBound(leftmostColumn, 0) || this.outOfBound(rightmostColumn, 0)) {
      throw Error('Matrix index out of bound')
    }
    const numberOfColumns = rightmostColumn - leftmostColumn + 1
    for (const row of this.matrix) {
      row.splice(leftmostColumn, numberOfColumns)
    }
    this.size.width -= numberOfColumns
  }

  public zeroArrays(count: number, size: number) {
    const result = []
    for (let i = 0; i < count; ++i) {
      result.push(new Array(size).fill(0))
    }
    return result
  }

  public get(col: number, row: number): number {
    if (this.outOfBound(col, row)) {
      throw Error('Matrix index out of bound')
    }
    return this.matrix[row][col]
  }

  public set(col: number, row: number, value: number): void {
    if (this.outOfBound(col, row)) {
      throw Error('Matrix index out of bound')
    }
    this.matrix[row][col] = value
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

  public* generateFlatValues(): IterableIterator<number> {
    for (let row = 0; row < this.size.height; ++row) {
      for (let col = 0; col < this.size.width; ++col) {
        yield this.matrix[row][col]
      }
    }
  }

  private outOfBound(col: number, row: number): boolean {
    return col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1
  }
}
