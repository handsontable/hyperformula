/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {ErrorMessage} from './error-message'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {InterpreterState} from './interpreter/InterpreterState'
import {Maybe} from './Maybe'
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

export class MatrixSizePredictor {
  constructor(
    private config: Config,
    private functionRegistry: FunctionRegistry,
  ) {
  }

  public checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): Maybe<MatrixSize> {
    return this._checkMatrixSize(ast, {formulaAddress, arraysFlag: this.config.arrays})
  }

  private _checkMatrixSize(ast: Ast, state: InterpreterState): Maybe<MatrixSize> {
    switch (ast.type) {
      case AstNodeType.FUNCTION_CALL: {
        const metadata = this.functionRegistry.getMetadata(ast.procedureName)
        const subChecks = ast.args.map((arg) => this._checkMatrixSize(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))
        switch (ast.procedureName) {
          case 'MMULT': {
            if (ast.args.length !== 2) {
              return undefined
            }

            const [left, right] = subChecks

            if (left === undefined) {
              return left
            } else if (right === undefined) {
              return right
            } else if (left.width !== right.height) {
              return undefined
            } else {
              return matrixSizeForMultiplication(left, right)
            }
          }
          case 'MEDIANPOOL':
          case 'MAXPOOL': {
            if (ast.args.length < 2 || ast.args.length > 3) {
              return undefined
            }

            const matrix = subChecks[0]
            if (matrix === undefined) {
              return undefined
            }
            const windowArg = ast.args[1]
            let window

            if (windowArg.type === AstNodeType.NUMBER) {
              window = windowArg.value
            } else {
              window = 1
            }

            let stride = window

            if (ast.args.length === 3) {
              const strideArg = ast.args[2]
              if (strideArg.type === AstNodeType.NUMBER) {
                stride = strideArg.value
              } else {
                stride = 1
              }
            }

            if (window > matrix.width || window > matrix.height
              || stride > window
              || (matrix.width - window) % stride !== 0 || (matrix.height - window) % stride !== 0) {
              return undefined
            }

            return matrixSizeForPoolFunction(matrix, window, stride)
          }
          case 'TRANSPOSE': {
            if (ast.args.length !== 1) {
              return undefined
            }

            const size = subChecks[0]

            return size === undefined ? undefined : matrixSizeForTranspose(size)
          }
          case 'ARRAYFORMULA': {
            if (ast.args.length !== 1) {
              return undefined
            }
            return subChecks[0]
          }
          default: {
            return new MatrixSize(1,1)
          }
        }
      }
      case AstNodeType.CELL_RANGE: {
        const range = AbsoluteCellRange.fromCellRangeOrUndef(ast, state.formulaAddress)
        if (range === undefined) {
          return undefined
        } else {
          return new MatrixSize(range.width(), range.height(), true)
        }
      }
      case AstNodeType.STRING:
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
        const left = this._checkMatrixSize(ast.left, state)
        if (left === undefined) {
          return undefined
        }
        const right = this._checkMatrixSize(ast.right, state)
        if (right === undefined) {
          return right
        }
        if(!state.arraysFlag && (left.height>1 || left.width>1 || right.height>1 || right.width>1)) {
          return undefined
        }
        return matrixSizeForBinaryOp(left, right)
      }
      case AstNodeType.MINUS_UNARY_OP:
      case AstNodeType.PLUS_UNARY_OP:
      case AstNodeType.PERCENT_OP: {
        const val = this._checkMatrixSize(ast.value, state)
        if (val === undefined) {
          return undefined
        }
        if(!state.arraysFlag && (val.height>1 || val.width>1)) {
          return undefined
        }
        return matrixSizeForUnaryOp(val)
      }
      case AstNodeType.EMPTY:
        return undefined
      default:
        return undefined
    }
  }
}

