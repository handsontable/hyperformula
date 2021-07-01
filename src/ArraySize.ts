/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {InterpreterState} from './interpreter/InterpreterState'
import {ArgumentTypes} from './interpreter/plugin/FunctionPlugin'
import {Ast, AstNodeType, ProcedureAst} from './parser'

export class ArraySize {
  public static fromMatrix<T>(matrix: T[][]): ArraySize {
    return new ArraySize(matrix.length > 0 ? matrix[0].length : 0, matrix.length)
  }

  public static error() {
    return new ArraySize(1, 1, true)
  }

  public static scalar() {
    return new ArraySize(1, 1, false)
  }

  constructor(
    public width: number,
    public height: number,
    public isRef: boolean = false,
  ) {
    if (width <= 0 || height <= 0) {
      throw Error('Incorrect matrix size')
    }
  }

  isScalar(): boolean {
    return (this.width<=1 && this.height<=1) || this.isRef
  }
}

export function matrixSizeForTranspose(inputSize: ArraySize): ArraySize {
  return new ArraySize(inputSize.height, inputSize.width)
}

export function matrixSizeForMultiplication(leftMatrixSize: ArraySize, rightMatrixSize: ArraySize): ArraySize {
  return new ArraySize(rightMatrixSize.width, leftMatrixSize.height)
}

export function matrixSizeForPoolFunction(inputMatrix: ArraySize, windowSize: number, stride: number): ArraySize {
  return new ArraySize(
    1 + (inputMatrix.width - windowSize) / stride,
    1 + (inputMatrix.height - windowSize) / stride,
  )
}

function matrixSizeForBinaryOp(leftMatrixSize: ArraySize, rightMatrixSize: ArraySize): ArraySize {
  return new ArraySize(Math.max(leftMatrixSize.width, rightMatrixSize.width), Math.max(leftMatrixSize.height, rightMatrixSize.height))
}

function matrixSizeForUnaryOp(matrixSize: ArraySize): ArraySize {
  return new ArraySize(matrixSize.width, matrixSize.height)
}

export class ArraySizePredictor {
  constructor(
    private config: Config,
    private functionRegistry: FunctionRegistry,
  ) {
  }

  public checkMatrixSize(ast: Ast, formulaAddress: SimpleCellAddress): ArraySize {
    return this._checkMatrixSize(ast, {formulaAddress, arraysFlag: this.config.useArrayArithmetic})
  }

  private checkMatrixSizeForFunction(ast: ProcedureAst, state: InterpreterState): ArraySize {
    const metadata = this.functionRegistry.getMetadata(ast.procedureName)
    const subChecks = ast.args.map((arg) => this._checkMatrixSize(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))
    switch (ast.procedureName) {
      case 'MMULT': {
        if (ast.args.length !== 2) {
          return ArraySize.error()
        }

        const [left, right] = subChecks

        return matrixSizeForMultiplication(left, right)
      }
      case 'MEDIANPOOL':
      case 'MAXPOOL': {
        if (ast.args.length < 2 || ast.args.length > 3) {
          return ArraySize.error()
        }

        const matrix = subChecks[0]
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
          return ArraySize.error()
        }

        return matrixSizeForPoolFunction(matrix, window, stride)
      }
      case 'TRANSPOSE': {
        if (ast.args.length !== 1) {
          return ArraySize.error()
        }

        const [size] = subChecks

        return matrixSizeForTranspose(size)
      }
      case 'ARRAYFORMULA': {
        if (ast.args.length !== 1) {
          return ArraySize.error()
        }
        return subChecks[0]
      }
      case 'FILTER': {
        if (ast.args.length <= 1) {
          return ArraySize.error()
        }
        const width = Math.max(...(subChecks).map(val => val.width))
        const height = Math.max(...(subChecks).map(val => val.height))
        return new ArraySize(width, height)
      }
      case 'SWITCH': {
        if (ast.args.length === 0) {
          return ArraySize.error()
        }
        const [{width, height}] = subChecks
        return new ArraySize(width, height)
      }
      case 'ARRAY_CONSTRAIN': {
        if (ast.args.length !== 3) {
          return ArraySize.error()
        }
        let {height, width} = subChecks[0]
        if (ast.args[1].type === AstNodeType.NUMBER) {
          height = Math.min(height, ast.args[1].value)
        }
        if (ast.args[2].type === AstNodeType.NUMBER) {
          width = Math.min(width, ast.args[2].value)
        }
        if (height < 1 || width < 1 || !Number.isInteger(height) || !Number.isInteger(width)) {
          return ArraySize.error()
        }
        return new ArraySize(width, height)
      }
      default: {
        if(metadata === undefined || metadata.expandRanges || !state.arraysFlag || metadata.vectorizationForbidden || metadata.parameters === undefined) {
          return new ArraySize(1, 1)
        }
        const argumentDefinitions = [...metadata.parameters]
        if (metadata.repeatLastArgs === undefined && argumentDefinitions.length < subChecks.length) {
          return ArraySize.error()
        }
        if (metadata.repeatLastArgs !== undefined && argumentDefinitions.length < subChecks.length &&
          (subChecks.length - argumentDefinitions.length) % metadata.repeatLastArgs !== 0) {
          return ArraySize.error()
        }

        while(argumentDefinitions.length < subChecks.length) {
          argumentDefinitions.push(...argumentDefinitions.slice(argumentDefinitions.length-metadata.repeatLastArgs!))
        }

        let maxWidth = 1
        let maxHeight = 1
        for(let i=0;i<subChecks.length;i++) {
          if(argumentDefinitions[i].argumentType !== ArgumentTypes.RANGE && argumentDefinitions[i].argumentType !== ArgumentTypes.ANY) {
            maxHeight = Math.max(maxHeight, subChecks[i].height)
            maxWidth = Math.max(maxWidth, subChecks[i].width)
          }
        }
        return new ArraySize(maxWidth, maxHeight)
      }
    }

  }

  private _checkMatrixSize(ast: Ast, state: InterpreterState): ArraySize {
    switch (ast.type) {
      case AstNodeType.FUNCTION_CALL: {
        return this.checkMatrixSizeForFunction(ast, state)
      }
      case AstNodeType.CELL_RANGE: {
        const range = AbsoluteCellRange.fromCellRangeOrUndef(ast, state.formulaAddress)
        if (range === undefined) {
          return ArraySize.error()
        } else {
          return new ArraySize(range.width(), range.height(), true)
        }
      }
      case AstNodeType.MATRIX: {
        const heights = []
        const widths = []
        for(const row of ast.args) {
          const sizes = row.map(ast => this._checkMatrixSize(ast, state))
          const h = Math.min(...sizes.map(size => size.height))
          const w = sizes.reduce((total, size) => total+size.width, 0)
          heights.push(h)
          widths.push(w)
        }
        const height = heights.reduce((total, h) => total+h, 0)
        const width = Math.min(...widths)
        return new ArraySize(width, height)
      }
      case AstNodeType.STRING:
      case AstNodeType.NUMBER:
        return ArraySize.scalar()
      case AstNodeType.CELL_REFERENCE:
        return new ArraySize(1, 1, true)
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
        const right = this._checkMatrixSize(ast.right, state)
        if (!state.arraysFlag && (left.height > 1 || left.width > 1 || right.height > 1 || right.width > 1)) {
          return ArraySize.error()
        }
        return matrixSizeForBinaryOp(left, right)
      }
      case AstNodeType.MINUS_UNARY_OP:
      case AstNodeType.PLUS_UNARY_OP:
      case AstNodeType.PERCENT_OP: {
        const val = this._checkMatrixSize(ast.value, state)
        if (!state.arraysFlag && (val.height > 1 || val.width > 1)) {
          return ArraySize.error()
        }
        return matrixSizeForUnaryOp(val)
      }
      case AstNodeType.EMPTY:
        return ArraySize.error()
      default:
        return ArraySize.error()
    }
  }
}

