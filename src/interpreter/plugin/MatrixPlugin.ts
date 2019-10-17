import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {checkMatrixSize, Matrix} from '../../Matrix'
import {Ast, AstNodeType, NumberAst, ProcedureAst} from '../../parser'
import {Interpreter} from '../Interpreter'
import {FunctionPlugin} from './FunctionPlugin'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'

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
    const left = ast.args[0]
    const right = ast.args[1]

    let leftMatrix = this.evaluateAst(left, formulaAddress)
    let rightMatrix = this.evaluateAst(right, formulaAddress)

    if (leftMatrix instanceof CellError) {
      return leftMatrix
    } else if (typeof leftMatrix === 'number') {
      leftMatrix = SimpleRangeValue.fromScalar(leftMatrix)
    } else if (!(leftMatrix instanceof SimpleRangeValue) || !leftMatrix.hasOnlyNumbers()) {
      return new CellError(ErrorType.VALUE)
    }

    if (rightMatrix instanceof CellError) {
      return rightMatrix
    } else if (typeof rightMatrix === 'number') {
      rightMatrix = SimpleRangeValue.fromScalar(rightMatrix)
    } else if (!(rightMatrix instanceof SimpleRangeValue) || !rightMatrix.hasOnlyNumbers()) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = {
      width: rightMatrix.width(),
      height: leftMatrix.height(),
    }

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0
      for (let i = 0; i < width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x as number]
      }
      return sum
    }).setOutput([outputSize.width, outputSize.height])

    return SimpleRangeValue.onlyData(
      kernel(leftMatrix.raw(), rightMatrix.raw(), leftMatrix.width()) as number[][],
      outputSize
    )
  }

  public maxpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    let rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
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
    } else if (typeof rangeMatrix === 'number') {
      rangeMatrix = SimpleRangeValue.fromScalar(rangeMatrix)
    } else if (!(rangeMatrix instanceof SimpleRangeValue)) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = {
      width: 1 + (rangeMatrix.width() - windowSize) / stride,
      height: 1 + (rangeMatrix.height() - windowSize) / stride,
    }

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][], windowSize: number, stride: number) {
      const leftCornerX = this.thread.x as number * stride
      const leftCornerY = this.thread.y as number * stride
      let currentMax = a[leftCornerY][leftCornerX]
      for (let i = 0; i < windowSize; i++) {
        for (let j = 0; j < windowSize; j++) {
          currentMax = Math.max(currentMax, a[leftCornerY + i][leftCornerX + j])
        }
      }
      return currentMax
    }).setOutput([ outputSize.width, outputSize.height ])

    return SimpleRangeValue.onlyData(
      kernel(rangeMatrix.raw(), windowSize, stride) as number[][],
      outputSize
    )
  }

  public medianpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    let rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
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
    } else if (typeof rangeMatrix === 'number') {
      rangeMatrix = SimpleRangeValue.fromScalar(rangeMatrix)
    } else if (!(rangeMatrix instanceof SimpleRangeValue)) {
      return new CellError(ErrorType.VALUE)
    }

    const outputSize = {
      width: 1 + (rangeMatrix.width() - windowSize) / stride,
      height: 1 + (rangeMatrix.height() - windowSize) / stride,
    }

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][], windowSize: number, stride: number) {
      const leftCornerX = this.thread.x as number * stride
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
    }).setOutput([ outputSize.width, outputSize.height ])

    return SimpleRangeValue.onlyData(
      kernel(rangeMatrix.raw(), windowSize, stride) as number[][],
      outputSize
    )
  }

  public transpose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    let value = this.evaluateAst(ast.args[0], formulaAddress)

    if (value instanceof CellError) {
      return value
    } else if (typeof value === 'number') {
      value = SimpleRangeValue.fromScalar(value)
    } else if (!(value instanceof SimpleRangeValue) || !value.hasOnlyNumbers()) {
      return new CellError(ErrorType.VALUE)
    }

    const matrixSize = checkMatrixSize(ast, formulaAddress)
    if (!matrixSize) {
      throw new Error("Size of a transpose can't be computed")
    }

    const input = value.raw()
    const result: number[][] = []
    for (let i=0; i<matrixSize.height; ++i) {
      result[i] = [];
      for (let j=0; j<matrixSize.width; ++j) {
        result[i][j] = input[j][i]
      }
    }

    return SimpleRangeValue.onlyData(
      result,
      {
        width: matrixSize.width,
        height: matrixSize.height,
      },
    )
  }
}
