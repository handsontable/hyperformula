/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {ErrorMessage} from './error-message'
import {Ast, AstNodeType} from './parser'

/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

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
  return new MatrixSize(Math.max(leftMatrixSize.width, rightMatrixSize.width), Math.max(leftMatrixSize.height, rightMatrixSize.height))
}

function matrixSizeForUnaryOp(matrixSize: MatrixSize): MatrixSize {
  return new MatrixSize(matrixSize.width, matrixSize.height)
}

function checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
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
    case AstNodeType.CELL_RANGE: {
      const range = AbsoluteCellRange.fromCellRangeOrUndef(ast, formulaAddress)
      if (range === undefined) {
        return new CellError(ErrorType.VALUE)
      } else {
        return new MatrixSize(range.width(), range.height(), true)
      }
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
    case AstNodeType.TIMES_OP: {
      const left = checkMatrixSize(ast.left, formulaAddress)
      if (left instanceof CellError) {
        return left
      }
      const right = checkMatrixSize(ast.right, formulaAddress)
      if (right instanceof CellError) {
        return right
      }
      return matrixSizeForBinaryOp(left, right)
    }
    case AstNodeType.MINUS_UNARY_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.PERCENT_OP: {
      const val = checkMatrixSize(ast.value, formulaAddress)
      if (val instanceof CellError) {
        return val
      }
      return matrixSizeForUnaryOp(val)
    }
    default:
      return new CellError(ErrorType.VALUE)
  }
}

export class MatrixSizePredictor {
  constructor(
    private config: Config,
  ) {
  }

  public checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): MatrixSizeCheck {
    return checkMatrixSize(ast, formulaAddress)
  }
}

