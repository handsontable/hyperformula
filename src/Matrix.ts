/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress, simpleCellAddress} from './Cell'
import {Ast, AstNodeType} from './parser'

export class MatrixSize {
  constructor(
    public width: number,
    public height: number,
  ) {
    if (width <= 0 || height <= 0) {
      throw Error('Incorrect matrix size')
    }
  }
}

export type MatrixSizeCheck = MatrixSize | CellError

export function matrixSizeForTranspose(inputSize: MatrixSize): MatrixSize {
  return new MatrixSize(inputSize.height, inputSize.width)
}

export function matrixSizeForMultiplication(leftMatrixSize: MatrixSize, rightMatrixSize: MatrixSize): MatrixSize {
  return new MatrixSize(rightMatrixSize.width, leftMatrixSize.height)
}

export function matrixSizeForPoolFunction(inputMatrix: MatrixSize, windowSize: number, stride: number): MatrixSize {
  return new MatrixSize(
    1 + (inputMatrix.width - windowSize) / stride,
    1 + (inputMatrix.height - windowSize) / stride,
  )
}

export function checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
  if (ast.type === AstNodeType.FUNCTION_CALL) {
    switch (ast.procedureName) {
      case 'MMULT': {
        if (ast.args.length !== 2) {
          return new CellError(ErrorType.NA)
        }
        if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
          return new CellError(ErrorType.NUM)
        }

        const left = checkMatrixSize(ast.args[0], formulaAddress)
        const right = checkMatrixSize(ast.args[1], formulaAddress)

        if (left instanceof CellError) {
          return left
        } else if (right instanceof CellError) {
          return right
        } else if (left.width !== right.height) {
          return new CellError(ErrorType.VALUE)
        } else {
          return matrixSizeForMultiplication(left, right)
        }
      }
      case 'MEDIANPOOL':
      case 'MAXPOOL': {
        if (ast.args.length < 2 || ast.args.length > 3) {
          return new CellError(ErrorType.NA)
        }
        if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
          return new CellError(ErrorType.NUM)
        }

        const matrix = checkMatrixSize(ast.args[0], formulaAddress)
        const windowArg = ast.args[1]

        if (matrix instanceof CellError) {
          return matrix
        } else if (windowArg.type !== AstNodeType.NUMBER) {
          return new CellError(ErrorType.VALUE)
        }

        const window = windowArg.value
        let stride = windowArg.value

        if (ast.args.length === 3) {
          const strideArg = ast.args[2]
          if (strideArg.type === AstNodeType.NUMBER) {
            stride = strideArg.value
          } else {
            return new CellError(ErrorType.VALUE)
          }
        }

        if (window > matrix.width || window > matrix.height
          || stride > window
          || (matrix.width - window) % stride !== 0 || (matrix.height - window) % stride !== 0) {
          return new CellError(ErrorType.VALUE)
        }

        return matrixSizeForPoolFunction(matrix, window, stride)
      }
      case 'TRANSPOSE': {
        if (ast.args.length !== 1) {
          return new CellError(ErrorType.NA)
        }

        if (ast.args[0].type === AstNodeType.EMPTY) {
          return new CellError(ErrorType.NUM)
        }
        const size = checkMatrixSize(ast.args[0], formulaAddress)

        return size instanceof CellError ? size : matrixSizeForTranspose(size)
      }
      default: {
        return new CellError(ErrorType.VALUE)
      }
    }
  } else if (ast.type === AstNodeType.RANGE_OP) {
    const range = AbsoluteCellRange.fromAst(ast.left, ast.right, formulaAddress)
    return {width: range.width(), height: range.height()}
  } else if (ast.type === AstNodeType.NUMBER || ast.type === AstNodeType.CELL_REFERENCE) {
    return {width: 1, height: 1}
  } else {
    return new CellError(ErrorType.VALUE)
  }
}

export interface IMatrix {
  size: MatrixSize,

  width(): number,

  height(): number,

  get(col: number, row: number): number | CellError,
}

export class NotComputedMatrix implements IMatrix {
  constructor(public readonly size: MatrixSize) {
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(col: number, row: number): number {
    throw Error('Matrix not computed yet.')
  }
}

export class Matrix implements IMatrix {
  public size: MatrixSize
  private readonly matrix: number[][]

  constructor(matrix: number[][]) {
    this.size = new MatrixSize(matrix.length > 0 ? matrix[0].length : 0, matrix.length)
    this.matrix = matrix
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

  public* generateValues(leftCorner: SimpleCellAddress): IterableIterator<[number, SimpleCellAddress]> {
    for (let row = 0; row < this.size.height; ++row) {
      for (let col = 0; col < this.size.width; ++col) {
        yield [this.matrix[row][col], simpleCellAddress(leftCorner.sheet, leftCorner.col + col, leftCorner.row + row)]
      }
    }
  }

  private outOfBound(col: number, row: number): boolean {
    return col < 0 || row < 0 || row > this.size.height - 1 || col > this.size.width - 1
  }
}

export class ErroredMatrix implements IMatrix {
  constructor(
    private readonly error: CellError,
    public readonly size: MatrixSize,
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(col: number, row: number): CellError {
    return this.error
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }
}
