/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {MatrixSize, matrixSizeForMultiplication, matrixSizeForPoolFunction} from '../../MatrixSize'
import {ProcedureAst} from '../../parser'
import {Interpreter} from '../Interpreter'
import {InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {InterpreterState} from '../InterpreterState'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export type KernelRunShortcut = (...args: any[]) => number[][]

export type KernelFunction = ((
  this: KernelFunctionThis,
  ...args: any[]
) => number)

export interface KernelFunctionThis {
  thread: {
    x: number,
    y?: number,
  },
}


export class MatrixPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MatrixPlugin>{
  public static implementedFunctions = {
    'MMULT': {
      method: 'mmult',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'TRANSPOSE': {
      method: 'transpose',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'MAXPOOL': {
      method: 'maxpool',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
      ],
    },
    'MEDIANPOOL': {
      method: 'medianpool',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
      ],
    },
  }

  private readonly createKernel: (kernel: KernelFunction, outputSize: MatrixSize) => KernelRunShortcut

  constructor(interpreter: Interpreter) {
    super(interpreter)
    if (this.config.gpujs === undefined) {
      this.createKernel = this.createCpuKernel
    } else {
      this.createKernel = this.createGpuJsKernel
    }
  }

  public mmult(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('MMULT'), (leftMatrix: SimpleRangeValue, rightMatrix: SimpleRangeValue) => {
      if (!leftMatrix.hasOnlyNumbers() || !rightMatrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      if( rightMatrix.height() !== leftMatrix.width()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.MatrixDimensions)
      }
      const outputSize = matrixSizeForMultiplication(leftMatrix.size, rightMatrix.size)

      const result = this.createKernel(function(a: number[][], b: number[][], width: number): number {
        let sum = 0
        for (let i = 0; i < width; ++i) {
          sum += a[this.thread.y as number][i] * b[i][this.thread.x]
        }
        return sum
      }, outputSize)(leftMatrix.rawNumbers(), rightMatrix.rawNumbers(), leftMatrix.width())

      return SimpleRangeValue.onlyNumbers(result)
    })
  }

  public maxpool(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('MAXPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      if (!matrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      const outputSize = matrixSizeForPoolFunction(matrix.size, windowSize, stride)

      const result = this.createKernel(function(a: number[][], windowSize: number, stride: number): number {
        const leftCornerX = this.thread.x * stride
        const leftCornerY = this.thread.y as number * stride
        let currentMax = a[leftCornerY][leftCornerX]
        for (let i = 0; i < windowSize; i++) {
          for (let j = 0; j < windowSize; j++) {
            currentMax = Math.max(currentMax, a[leftCornerY + i][leftCornerX + j])
          }
        }
        return currentMax
      }, outputSize)(matrix.rawNumbers(), windowSize, stride)

      return SimpleRangeValue.onlyNumbers(result)
    })
  }

  public medianpool(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('MEDIANPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      if (!matrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      const outputSize = matrixSizeForPoolFunction(matrix.size, windowSize, stride)

      const result = this.createKernel(function(a: number[][], windowSize: number, stride: number): number {
        const leftCornerX = this.thread.x * stride
        const leftCornerY = this.thread.y as number * stride
        let currentMax = a[leftCornerY][leftCornerX]
        for (let i = 0; i < windowSize; i++) {
          for (let j = 0; j < windowSize; j++) {
            currentMax = Math.max(currentMax, a[leftCornerY + i][leftCornerX + j])
          }
        }
        let currentMin = a[leftCornerY][leftCornerX]
        for (let i2 = 0; i2 < windowSize; i2++) {
          for (let j2 = 0; j2 < windowSize; j2++) {
            currentMin = Math.min(currentMin, a[leftCornerY + i2][leftCornerX + j2])
          }
        }

        const numberOfElements = windowSize * windowSize
        let leftEnd = currentMin
        let rightEnd = currentMax
        let result = 42
        for (let iter = 0; iter < 32; iter++) {
          const medianGuess = (leftEnd + rightEnd) / 2
          let medianGuessCount = 0
          for (let i3 = 0; i3 < windowSize; i3++) {
            for (let j3 = 0; j3 < windowSize; j3++) {
              if (a[leftCornerY + i3][leftCornerX + j3] > medianGuess) {
                medianGuessCount++
              }
            }
          }

          if (windowSize % 2 === 0) {
            if (medianGuessCount === numberOfElements / 2) {
              result = medianGuess
              break
            } else if (medianGuessCount > numberOfElements / 2) {
              leftEnd = medianGuess
            } else {
              rightEnd = medianGuess
            }
          } else {
            if (medianGuessCount === (numberOfElements - 1) / 2) {
              result = medianGuess
              break
            } else if (medianGuessCount > (numberOfElements - 1) / 2) {
              leftEnd = medianGuess
            } else {
              rightEnd = medianGuess
            }
          }
        }
        return result
      }, outputSize)(matrix.rawNumbers(), windowSize, stride)

      return SimpleRangeValue.onlyNumbers(result)
    })
  }

  public transpose(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runMatrixFunction(ast.args, state, this.metadata('TRANSPOSE'), (matrix: SimpleRangeValue) => {
      if (!matrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      const input = matrix.rawNumbers()
      const inputSize = matrix.size
      const result: number[][] = []
      for (let i = 0; i < inputSize.width; ++i) {
        result[i] = []
        for (let j = 0; j < inputSize.height; ++j) {
          result[i][j] = input[j][i]
        }
      }

      return SimpleRangeValue.onlyNumbers(result)
    })
  }

  private createCpuKernel = (kernel: KernelFunction, outputSize: MatrixSize): KernelRunShortcut => {
    return function(...args: any[]) {
      const result: number[][] = []
      for (let y = 0; y < outputSize.height; ++y) {
        result.push([])
        for (let x = 0; x < outputSize.width; ++x) {
          result[y][x] = kernel.apply({ thread: { x, y }}, args)
        }
      }
      return result
    }
  }

  private createGpuJsKernel = (kernel: KernelFunction, outputSize: MatrixSize): KernelRunShortcut => {
    return this.interpreter.getGpuInstance()
      .createKernel(kernel)
      .setPrecision('unsigned')
      .setOutput([outputSize.width, outputSize.height]) as KernelRunShortcut
  }
}
