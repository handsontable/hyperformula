import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {matrixSizeForMultiplication, matrixSizeForPoolFunction, matrixSizeForTranspose} from '../../Matrix'
import {Ast, AstNodeType, NumberAst, ProcedureAst} from '../../parser'
import {coerceToRangeNumbersOrError} from '../ArithmeticHelper'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

export class MatrixPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    mmult: {
      translationKey: 'MMULT',
    },
    transpose: {
      translationKey: 'TRANSPOSE',
    },
    maxpool: {
      translationKey: 'MAXPOOL',
    },
    medianpool: {
      translationKey: 'MEDIANPOOL',
    },
  }

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const [left, right] = ast.args

    const leftMatrix = coerceToRangeNumbersOrError(this.evaluateAst(left, formulaAddress))
    const rightMatrix = coerceToRangeNumbersOrError(this.evaluateAst(right, formulaAddress))

    if (leftMatrix instanceof CellError) {
      return leftMatrix
    } else if (rightMatrix instanceof CellError) {
      return rightMatrix
    } else if (leftMatrix === null || rightMatrix === null) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = matrixSizeForMultiplication(leftMatrix.size, rightMatrix.size)

    const gpu = this.interpreter.getGpuInstance()
    const kernel = gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0
      for (let i = 0; i < width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x]
      }
      return sum
    }).setPrecision('unsigned')
      .setOutput([outputSize.width, outputSize.height])

    return SimpleRangeValue.onlyNumbersDataWithoutRange(
      kernel(leftMatrix.rawNumbers(), rightMatrix.rawNumbers(), leftMatrix.width()) as number[][],
      outputSize,
    )
  }

  public maxpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    const rangeMatrix = coerceToRangeNumbersOrError(this.evaluateAst(rangeArg, formulaAddress))
    const windowSize = sizeArg.value
    let stride = windowSize

    if (ast.args.length === 3) {
      const strideArg = ast.args[2]
      if (strideArg.type === AstNodeType.NUMBER) {
        stride = strideArg.value
      } else {
        return new CellError(ErrorType.VALUE)
      }
    }

    if (rangeMatrix instanceof CellError) {
      return rangeMatrix
    } else if (rangeMatrix === null) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = matrixSizeForPoolFunction(rangeMatrix.size, windowSize, stride)

    /* istanbul ignore next: gpu.js */
    const gpu = this.interpreter.getGpuInstance()
    const kernel = gpu.createKernel(function(a: number[][], windowSize: number, stride: number) {
      const leftCornerX = this.thread.x * stride
      const leftCornerY = this.thread.y as number * stride
      let currentMax = a[leftCornerY][leftCornerX]
      for (let i = 0; i < windowSize; i++) {
        for (let j = 0; j < windowSize; j++) {
          currentMax = Math.max(currentMax, a[leftCornerY + i][leftCornerX + j])
        }
      }
      return currentMax
    }).setPrecision('unsigned')
      .setOutput([outputSize.width, outputSize.height])

    return SimpleRangeValue.onlyNumbersDataWithoutRange(
      kernel(rangeMatrix.rawNumbers(), windowSize, stride) as number[][],
      outputSize,
    )
  }

  public medianpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    const rangeMatrix = coerceToRangeNumbersOrError(this.evaluateAst(rangeArg, formulaAddress))
    const windowSize = sizeArg.value
    let stride = windowSize

    if (ast.args.length === 3) {
      const strideArg = ast.args[2]
      if (strideArg.type === AstNodeType.NUMBER) {
        stride = strideArg.value
      } else {
        return new CellError(ErrorType.VALUE)
      }
    }

    if (rangeMatrix instanceof CellError) {
      return rangeMatrix
    } else if (rangeMatrix === null) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = matrixSizeForPoolFunction(rangeMatrix.size, windowSize, stride)

    /* istanbul ignore next: gpu.js */
    const gpu = this.interpreter.getGpuInstance()
    const kernel = gpu.createKernel(function(a: number[][], windowSize: number, stride: number) {
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
    }).setPrecision('unsigned')
      .setOutput([outputSize.width, outputSize.height])

    return SimpleRangeValue.onlyNumbersDataWithoutRange(
      kernel(rangeMatrix.rawNumbers(), windowSize, stride) as number[][],
      outputSize,
    )
  }

  public transpose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }
    const value = coerceToRangeNumbersOrError(this.evaluateAst(ast.args[0], formulaAddress))

    if (value instanceof CellError) {
      return value
    } else if (value === null) {
      return new CellError(ErrorType.VALUE)
    }

    const input = value.rawNumbers()
    const inputSize = value.size
    const result: number[][] = []
    for (let i = 0; i < inputSize.width; ++i) {
      result[i] = []
      for (let j = 0; j < inputSize.height; ++j) {
        result[i][j] = input[j][i]
      }
    }

    return SimpleRangeValue.onlyNumbersDataWithoutRange(result, matrixSizeForTranspose(inputSize))
  }
}
