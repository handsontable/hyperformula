/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import { CellContentParser } from '../../CellContentParser'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {Interpreter} from '../Interpreter'
import {InterpreterState} from '../InterpreterState'
import {InternalScalarValue, InterpreterValue} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
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

function arraySizeForMultiplication(leftArraySize: ArraySize, rightArraySize: ArraySize): ArraySize {
  return new ArraySize(rightArraySize.width, leftArraySize.height)
}

function arraySizeForPoolFunction(inputArray: ArraySize, windowSize: number, stride: number): ArraySize {
  return new ArraySize(
    1 + (inputArray.width - windowSize) / stride,
    1 + (inputArray.height - windowSize) / stride,
  )
}

export class MatrixPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MatrixPlugin> {
  public static implementedFunctions = {
    'MMULT': {
      method: 'mmult',
      arraySizeMethod: 'mmultArraySize',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'TRANSPOSE': {
      method: 'transpose',
      arraySizeMethod: 'transposeArraySize',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'MAXPOOL': {
      method: 'maxpool',
      arraySizeMethod: 'maxpoolArraySize',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
    'MEDIANPOOL': {
      method: 'medianpool',
      arraySizeMethod: 'medianpoolArraySize',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
  }

  private readonly createKernel: (kernel: KernelFunction, outputSize: ArraySize) => KernelRunShortcut

  constructor(interpreter: Interpreter, cellContentParser: CellContentParser) {
    super(interpreter, cellContentParser)
    if (this.config.gpujs === undefined) {
      this.createKernel = this.createCpuKernel
    } else {
      this.createKernel = this.createGpuJsKernel
    }
  }

  public mmult(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MMULT'), (leftMatrix: SimpleRangeValue, rightMatrix: SimpleRangeValue) => {
      if (!leftMatrix.hasOnlyNumbers() || !rightMatrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      if (rightMatrix.height() !== leftMatrix.width()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ArrayDimensions)
      }
      const outputSize = arraySizeForMultiplication(leftMatrix.size, rightMatrix.size)

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

  public mmultArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 2) {
      return ArraySize.error()
    }
    const metadata = this.metadata('MMULT')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))
    const [left, right] = subChecks
    return arraySizeForMultiplication(left, right)
  }

  public maxpool(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MAXPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      if (!matrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      const outputSize = arraySizeForPoolFunction(matrix.size, windowSize, stride)

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
    return this.runFunction(ast.args, state, this.metadata('MEDIANPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      if (!matrix.hasOnlyNumbers()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
      }
      const outputSize = arraySizeForPoolFunction(matrix.size, windowSize, stride)

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

  public maxpoolArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 3) {
      return ArraySize.error()
    }

    const metadata = this.metadata('MAXPOOL')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))

    const array = subChecks[0]
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

    if (window > array.width || window > array.height
      || stride > window
      || (array.width - window) % stride !== 0 || (array.height - window) % stride !== 0) {
      return ArraySize.error()
    }

    return arraySizeForPoolFunction(array, window, stride)
  }

  public medianpoolArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    return this.maxpoolArraySize(ast, state)
  }

  public transpose(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TRANSPOSE'), (matrix: SimpleRangeValue) => {
      const input = matrix.rawData()
      const inputSize = matrix.size
      const result: InternalScalarValue[][] = []
      for (let i = 0; i < inputSize.width; ++i) {
        result[i] = []
        for (let j = 0; j < inputSize.height; ++j) {
          result[i][j] = input[j][i]
        }
      }

      return SimpleRangeValue.onlyValues(result)
    })
  }

  public transposeArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }
    const metadata = this.metadata('MMULT')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.arrayFunction ?? false))))

    const [size] = subChecks

    return new ArraySize(size.height, size.width)
  }

  private createCpuKernel = (kernel: KernelFunction, outputSize: ArraySize): KernelRunShortcut => {
    return function(...args: any[]) {
      const result: number[][] = []
      for (let y = 0; y < outputSize.height; ++y) {
        result.push([])
        for (let x = 0; x < outputSize.width; ++x) {
          result[y][x] = kernel.apply({thread: {x, y}}, args)
        }
      }
      return result
    }
  }

  private createGpuJsKernel = (kernel: KernelFunction, outputSize: ArraySize): KernelRunShortcut => {
    return this.interpreter.getGpuInstance()
      .createKernel(kernel)
      .setPrecision('unsigned')
      .setOutput([outputSize.width, outputSize.height]) as KernelRunShortcut
  }
}
