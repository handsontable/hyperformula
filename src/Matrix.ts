/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress, simpleCellAddress} from './Cell'
import {ErrorMessage} from './error-message'
import {Ast, AstNodeType} from './parser'

export class MatrixSize {
  public static fromMatrix<T>(matrix: T[][]): MatrixSize {
    return new MatrixSize(matrix.length > 0 ? matrix[0].length : 0, matrix.length)
  }
  constructor(
    public width: number,
    public height: number,
    public isRef?: boolean,
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

function matrixSizeForBinaryOp(leftMatrixSize: MatrixSize, rightMatrixSize: MatrixSize): MatrixSize {
  return new MatrixSize(Math.max(leftMatrixSize.width,rightMatrixSize.width), Math.max(leftMatrixSize.height, rightMatrixSize.height))
}

function matrixSizeForUnaryOp(matrixSize: MatrixSize): MatrixSize {
  return new MatrixSize(matrixSize.width, matrixSize.height)
}

export function checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
  switch (ast.type) {
    case AstNodeType.FUNCTION_CALL:
      switch (ast.procedureName) {
        case 'MMULT': {
          if (ast.args.length !== 2) {
            return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
          }
          if (ast.args.some((astIt) => astIt.type === AstNodeType.EMPTY)) {
            return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg )
          }

          const left = checkMatrixSize(ast.args[0], formulaAddress)
          const right = checkMatrixSize(ast.args[1], formulaAddress)

          if (left instanceof CellError) {
            return left
          } else if (right instanceof CellError) {
            return right
          } else if (left.width !== right.height) {
            return new CellError(ErrorType.VALUE, ErrorMessage.MatrixDimensions)
          } else {
            return matrixSizeForMultiplication(left, right)
          }
        }
        case 'MEDIANPOOL':
        case 'MAXPOOL': {
          if (ast.args.length < 2 || ast.args.length > 3) {
            return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
          }
          if (ast.args.some((astIt) => astIt.type === AstNodeType.EMPTY)) {
            return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg )
          }

          const matrix = checkMatrixSize(ast.args[0], formulaAddress)
          const windowArg = ast.args[1]

          if (matrix instanceof CellError) {
            return matrix
          } else if (windowArg.type !== AstNodeType.NUMBER) {
            return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
          }

          const window = windowArg.value
          let stride = windowArg.value

          if (ast.args.length === 3) {
            const strideArg = ast.args[2]
            if (strideArg.type === AstNodeType.NUMBER) {
              stride = strideArg.value
            } else {
              return new CellError(ErrorType.VALUE, ErrorMessage.MatrixParams)
            }
          }

          if (window > matrix.width || window > matrix.height
            || stride > window
            || (matrix.width - window) % stride !== 0 || (matrix.height - window) % stride !== 0) {
            return new CellError(ErrorType.VALUE) //TODO
          }

          return matrixSizeForPoolFunction(matrix, window, stride)
        }
        case 'TRANSPOSE': {
          if (ast.args.length !== 1) {
            return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
          }

          if (ast.args[0].type === AstNodeType.EMPTY) {
            return new CellError(ErrorType.NUM, ErrorMessage.EmptyArg )
          }
          const size = checkMatrixSize(ast.args[0], formulaAddress)

          return size instanceof CellError ? size : matrixSizeForTranspose(size)
        }
        default: {
          return new CellError(ErrorType.VALUE, ErrorMessage.MatrixFunction)
        }
      }
    case AstNodeType.CELL_RANGE:
      const range = AbsoluteCellRange.fromCellRangeOrUndef(ast, formulaAddress)
      if(range === undefined) {
        return new CellError(ErrorType.VALUE)
      } else {
        return new MatrixSize(range.width(), range.height(), true)
      }
    case AstNodeType.NUMBER:
      return new MatrixSize(1, 1)
    case AstNodeType.CELL_REFERENCE:
      return new MatrixSize(1, 1, true)
    case AstNodeType.DIV_OP:
    case AstNodeType.CONCATENATE_OP:
    case AstNodeType.EQUALS_OP:
    case AstNodeType.GREATER_THAN_OP:
    case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
    case AstNodeType.LESS_THAN_OP:
    case AstNodeType.LESS_THAN_OR_EQUAL_OP:
    case AstNodeType.MINUS_OP:
    case AstNodeType.NOT_EQUAL_OP:
    case AstNodeType.PLUS_OP:
    case AstNodeType.POWER_OP:
    case AstNodeType.TIMES_OP:
      const left = checkMatrixSize(ast.left, formulaAddress)
      if(left instanceof CellError) {
        return left
      }
      const right = checkMatrixSize(ast.right, formulaAddress)
      if(right instanceof CellError) {
        return right
      }
      return matrixSizeForBinaryOp(left, right)
    case AstNodeType.MINUS_UNARY_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.PERCENT_OP:
      const val = checkMatrixSize(ast.value, formulaAddress)
      if(val instanceof CellError) {
        return val
      }
      return matrixSizeForUnaryOp(val)
    default:
      return new CellError(ErrorType.VALUE) //TODO

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
