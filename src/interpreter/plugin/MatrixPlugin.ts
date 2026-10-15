/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {AstNodeType, ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InternalScalarValue, InterpreterValue, isExtendedNumber} from '../InterpreterValue'
import {Maybe} from '../../Maybe'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

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

/**
 * Checks whether the square pooling windows fit the input array exactly: no window reaches outside of it, and
 * the last window in each direction ends at its last row or column.
 *
 * The window size and the stride have to be positive integers, the window has to fit inside the input array,
 * and both of its dimensions, reduced by the window size, have to be whole multiples of the stride. A stride
 * greater than the window size is allowed: the windows then skip the rows and columns between them.
 *
 * @param inputArray - dimensions of the pooled input array
 * @param windowSize - side length of the square pooling window
 * @param stride - distance between the top-left corners of two consecutive windows
 */
function isPoolWindowFittingInputArray(inputArray: ArraySize, windowSize: number, stride: number): boolean {
  return Number.isInteger(windowSize) && windowSize >= 1
    && Number.isInteger(stride) && stride >= 1
    && windowSize <= inputArray.width
    && windowSize <= inputArray.height
    && (inputArray.width - windowSize) % stride === 0
    && (inputArray.height - windowSize) % stride === 0
}

/**
 * Validates the arguments shared by the pooling functions (MAXPOOL, MEDIANPOOL).
 *
 * @param matrix - the pooled input range
 * @param windowSize - side length of the square pooling window
 * @param stride - distance between the top-left corners of two consecutive windows
 * @returns a {@link CellError} describing the violated constraint, or `undefined` when the arguments are valid
 */
function poolFunctionArgumentsError(matrix: SimpleRangeValue, windowSize: number, stride: number): Maybe<CellError> {
  if (!matrix.hasOnlyNumbers()) {
    return new CellError(ErrorType.VALUE, ErrorMessage.NumberRange)
  }

  if (!isPoolWindowFittingInputArray(matrix.size, windowSize, stride)) {
    return new CellError(ErrorType.VALUE, ErrorMessage.PoolDimensions)
  }

  return undefined
}

/**
 * Reads the numbers of a matrix argument, treating typed numbers (percentages, dates, currency) as plain numbers.
 *
 * @param matrix - the matrix argument
 * @returns the numbers of the matrix, the first error found in it, or the #VALUE! error when it holds any non-numeric value
 */
function numbersOrError(matrix: SimpleRangeValue): number[][] | CellError {
  let hasNonNumericValue = false
  const numbers: number[][] = []

  for (const row of matrix.rawData()) {
    const numbersInRow: number[] = []
    for (const value of row) {
      if (value instanceof CellError) {
        return value
      }
      if (!isExtendedNumber(value)) {
        hasNonNumericValue = true
        continue
      }
      numbersInRow.push(getRawValue(value))
    }
    numbers.push(numbersInRow)
  }

  return hasNonNumericValue ? new CellError(ErrorType.VALUE, ErrorMessage.NumberRange) : numbers
}

/**
 * Calculates the determinant with the fraction-free Bareiss elimination, so that a matrix of integers is
 * eliminated without rounding noise and a singular one gives exactly 0. Rows are swapped to bring the
 * entry of the greatest magnitude to the pivot position.
 *
 * @param matrix - a square matrix
 */
function determinant(matrix: number[][]): number {
  const elements = matrix.map((row) => row.slice())
  const size = elements.length
  let sign = 1
  let previousPivot = 1

  for (let k = 0; k < size - 1; k++) {
    let pivotRow = k
    for (let i = k + 1; i < size; i++) {
      if (Math.abs(elements[i][k]) > Math.abs(elements[pivotRow][k])) {
        pivotRow = i
      }
    }
    if (elements[pivotRow][k] === 0) {
      return 0
    }
    if (pivotRow !== k) {
      [elements[k], elements[pivotRow]] = [elements[pivotRow], elements[k]]
      sign = -sign
    }
    for (let i = k + 1; i < size; i++) {
      for (let j = k + 1; j < size; j++) {
        elements[i][j] = (elements[i][j] * elements[k][k] - elements[i][k] * elements[k][j]) / previousPivot
      }
    }
    previousPivot = elements[k][k]
  }

  return sign * elements[size - 1][size - 1]
}

/**
 * Builds the identity matrix.
 *
 * @param size - the number of rows and columns
 */
function identityMatrix(size: number): number[][] {
  return Array.from({length: size}, (_, row) => Array.from({length: size}, (_unused, column) => row === column ? 1 : 0))
}

/**
 * Inverts a non-singular square matrix with the Gauss-Jordan elimination and partial pivoting.
 *
 * @param matrix - a square matrix with a non-zero determinant
 */
function invert(matrix: number[][]): number[][] {
  const size = matrix.length
  const identity = identityMatrix(size)
  const augmented = matrix.map((row, i) => row.concat(identity[i]))

  for (let k = 0; k < size; k++) {
    let pivotRow = k
    for (let i = k + 1; i < size; i++) {
      if (Math.abs(augmented[i][k]) > Math.abs(augmented[pivotRow][k])) {
        pivotRow = i
      }
    }
    [augmented[k], augmented[pivotRow]] = [augmented[pivotRow], augmented[k]]
    const pivot = augmented[k][k]
    augmented[k] = augmented[k].map((value) => value / pivot)
    for (let i = 0; i < size; i++) {
      if (i !== k) {
        const factor = augmented[i][k]
        augmented[i] = augmented[i].map((value, j) => value - factor * augmented[k][j])
      }
    }
  }

  return augmented.map((row) => row.slice(size))
}

export class MatrixPlugin extends FunctionPlugin implements FunctionPluginTypecheck<MatrixPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'MMULT': {
      method: 'mmult',
      sizeOfResultArrayMethod: 'mmultArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'TRANSPOSE': {
      method: 'transpose',
      sizeOfResultArrayMethod: 'transposeArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'MUNIT': {
      method: 'munit',
      sizeOfResultArrayMethod: 'munitArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.SCALAR},
      ],
      vectorizationForbidden: true,
    },
    'MDETERM': {
      method: 'mdeterm',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'MINVERSE': {
      method: 'minverse',
      sizeOfResultArrayMethod: 'minverseArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
      ],
      vectorizationForbidden: true,
    },
    'MAXPOOL': {
      method: 'maxpool',
      sizeOfResultArrayMethod: 'maxpoolArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
    'MEDIANPOOL': {
      method: 'medianpool',
      sizeOfResultArrayMethod: 'medianpoolArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.RANGE},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1},
        {argumentType: FunctionArgumentType.INTEGER, minValue: 1, optionalArg: true},
      ],
      vectorizationForbidden: true,
    },
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
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
    const [left, right] = subChecks
    return arraySizeForMultiplication(left, right)
  }

  /**
   * Corresponds to MUNIT(Dimension).
   *
   * Returns the identity matrix of `Dimension` x `Dimension` cells. A fractional dimension is truncated;
   * a dimension below 1, or one that is not a number, returns the #VALUE! error.
   */
  public munit(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MUNIT'), (argument: InternalScalarValue) => {
      if (argument instanceof CellError) {
        return argument
      }
      const dimension = typeof argument === 'boolean' ? Number(argument) : argument
      if (typeof dimension !== 'number') {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberExpected)
      }
      const size = Math.trunc(dimension)
      if (!(size >= 1)) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      return SimpleRangeValue.onlyNumbers(identityMatrix(size))
    })
  }

  public munitArraySize(ast: ProcedureAst): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }
    const argument = ast.args[0]
    if (argument.type !== AstNodeType.NUMBER) {
      return ArraySize.scalar()
    }
    const size = Math.trunc(argument.value)
    return size >= 1 ? new ArraySize(size, size) : ArraySize.error()
  }

  /**
   * Corresponds to MDETERM(Array).
   *
   * Returns the determinant of a square matrix of numbers. A non-square matrix or a non-numeric value
   * returns the #VALUE! error. The elimination is exact for integers, so a singular matrix gives 0.
   */
  public mdeterm(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MDETERM'), (matrix: SimpleRangeValue) => {
      const numbers = numbersOrError(matrix)
      if (numbers instanceof CellError) {
        return numbers
      }
      if (matrix.width() !== matrix.height()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ArrayDimensions)
      }
      const result = determinant(numbers)
      return Number.isFinite(result) ? result : new CellError(ErrorType.NUM, ErrorMessage.NaN)
    })
  }

  /**
   * Corresponds to MINVERSE(Array).
   *
   * Returns the inverse of a square matrix of numbers. A non-square matrix or a non-numeric value returns
   * the #VALUE! error; a singular matrix returns the #NUM! error.
   */
  public minverse(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MINVERSE'), (matrix: SimpleRangeValue) => {
      const numbers = numbersOrError(matrix)
      if (numbers instanceof CellError) {
        return numbers
      }
      if (matrix.width() !== matrix.height()) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ArrayDimensions)
      }
      if (determinant(numbers) === 0) {
        return new CellError(ErrorType.NUM, ErrorMessage.SingularMatrix)
      }
      const result = invert(numbers)
      if (!result.every((row) => row.every(Number.isFinite))) {
        return new CellError(ErrorType.NUM, ErrorMessage.NaN)
      }
      return SimpleRangeValue.onlyNumbers(result)
    })
  }

  public minverseArraySize(ast: ProcedureAst, state: InterpreterState): ArraySize {
    if (ast.args.length !== 1) {
      return ArraySize.error()
    }
    const metadata = this.metadata('MINVERSE')
    const size = this.arraySizeForAst(ast.args[0], new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false)))
    return size.width === size.height ? new ArraySize(size.width, size.height) : ArraySize.error()
  }

  /**
   * Corresponds to MAXPOOL(Range, Window_size, Stride).
   *
   * Reduces the input range to the maximum value of every window of `Window_size` x `Window_size` cells,
   * moving the window by `Stride` cells; a stride greater than the window size skips the rows and columns
   * between the windows. The window has to fit inside the range and the range dimensions, reduced by the
   * window size, have to be whole multiples of the stride. Otherwise, the function returns the #VALUE! error.
   * A window size or stride that is not a positive integer returns the #NUM! error.
   */
  public maxpool(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MAXPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      const argumentsError = poolFunctionArgumentsError(matrix, windowSize, stride)
      if (argumentsError !== undefined) {
        return argumentsError
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

  /**
   * Corresponds to MEDIANPOOL(Range, Window_size, Stride).
   *
   * Reduces the input range to the median value of every window of `Window_size` x `Window_size` cells,
   * moving the window by `Stride` cells; a stride greater than the window size skips the rows and columns
   * between the windows. The window has to fit inside the range and the range dimensions, reduced by the
   * window size, have to be whole multiples of the stride. Otherwise, the function returns the #VALUE! error.
   * A window size or stride that is not a positive integer returns the #NUM! error.
   */
  public medianpool(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MEDIANPOOL'), (matrix: SimpleRangeValue, windowSize: number, stride: number = windowSize) => {
      const argumentsError = poolFunctionArgumentsError(matrix, windowSize, stride)
      if (argumentsError !== undefined) {
        return argumentsError
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
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

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
        stride = 1 // codecov: unreachable - strideArg is always type AstNodeType.NUMBER due to FunctionPlugin argument checking+coersion
      }
    }

    if (!isPoolWindowFittingInputArray(array, window, stride)) {
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
    const metadata = this.metadata('TRANSPOSE')
    const subChecks = ast.args.map((arg) => this.arraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))

    const [size] = subChecks

    return new ArraySize(size.height, size.width)
  }

  private createKernel(kernel: KernelFunction, outputSize: ArraySize): KernelRunShortcut {
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
}
