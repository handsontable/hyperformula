import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {MatrixVertex} from '../../DependencyGraph'
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

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue {
    const left = ast.args[0]
    const right = ast.args[1]

    let leftMatrix = this.evaluateAst(left, formulaAddress)
    let rightMatrix = this.evaluateAst(right, formulaAddress)

    if (leftMatrix instanceof CellError) {
      return this.errorMatrix(leftMatrix.type)
    } else if (typeof leftMatrix === 'number') {
      leftMatrix = SimpleRangeValue.fromScalar(leftMatrix, this.dependencyGraph)
    } else if (!(leftMatrix instanceof SimpleRangeValue) || leftMatrix.isErrorMatrix()) {
      return this.errorMatrix(ErrorType.VALUE)
    }

    if (rightMatrix instanceof CellError) {
      return this.errorMatrix(rightMatrix.type)
    } else if (typeof rightMatrix === 'number') {
      rightMatrix = SimpleRangeValue.fromScalar(rightMatrix, this.dependencyGraph)
    } else if (!(rightMatrix instanceof SimpleRangeValue) || rightMatrix.isErrorMatrix()) {
      return this.errorMatrix(ErrorType.VALUE)
    }

    const vertex = this.dependencyGraph.fetchCell(formulaAddress) as MatrixVertex

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0
      for (let i = 0; i < width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x as number]
      }
      return sum
    }).setOutput([vertex.width, vertex.height])

    return SimpleRangeValue.onlyData(
      kernel(leftMatrix.raw(), rightMatrix.raw(), leftMatrix.width()) as number[][],
      { width: vertex.width, height: vertex.height }, // that is incorrect, it should be one dimension from leftmatrix and one from rightmatrix
      this.dependencyGraph
    )
  }

  public maxpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    let rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
    const windowSize = sizeArg.value
    let stride = windowSize

    if (ast.args.length === 3) {
      const strideArg = ast.args[2]
      if (strideArg.type === AstNodeType.NUMBER) {
        stride = strideArg.value
      } else {
        return this.errorMatrix(ErrorType.VALUE)
      }
    }

    if (rangeMatrix instanceof CellError) {
      return this.errorMatrix(rangeMatrix.type)
    } else if (typeof rangeMatrix === 'number') {
      rangeMatrix = SimpleRangeValue.fromScalar(rangeMatrix, this.dependencyGraph)
    } else if (!(rangeMatrix instanceof SimpleRangeValue)) {
      return this.errorMatrix(ErrorType.VALUE)
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
    }).setOutput([
      1 + (rangeMatrix.width() - windowSize) / stride,
      1 + (rangeMatrix.height() - windowSize) / stride,
    ])

    return SimpleRangeValue.onlyData(
      kernel(rangeMatrix.raw(), windowSize, stride) as number[][],
      {
        width: 1 + (rangeMatrix.width() - windowSize) / stride,
        height: 1 + (rangeMatrix.height() - windowSize) / stride,
      },
      this.dependencyGraph
    )
  }

  public medianpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue {
    const [rangeArg, sizeArg] = ast.args as [Ast, NumberAst]

    let rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
    const windowSize = sizeArg.value
    let stride = windowSize

    if (ast.args.length === 3) {
      const strideArg = ast.args[2]
      if (strideArg.type === AstNodeType.NUMBER) {
        stride = strideArg.value
      } else {
        return this.errorMatrix(ErrorType.VALUE)
      }
    }

    if (rangeMatrix instanceof CellError) {
      return this.errorMatrix(rangeMatrix.type)
    } else if (typeof rangeMatrix === 'number') {
      rangeMatrix = SimpleRangeValue.fromScalar(rangeMatrix, this.dependencyGraph)
    } else if (!(rangeMatrix instanceof SimpleRangeValue)) {
      return this.errorMatrix(ErrorType.VALUE)
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
    }).setOutput([
      1 + (rangeMatrix.width() - windowSize) / stride,
      1 + (rangeMatrix.height() - windowSize) / stride,
    ])

    return SimpleRangeValue.onlyData(
      kernel(rangeMatrix.raw(), windowSize, stride) as number[][],
      {
        width: 1 + (rangeMatrix.width() - windowSize) / stride,
        height: 1 + (rangeMatrix.height() - windowSize) / stride,
      },
      this.dependencyGraph
    )
  }

  public transpose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): SimpleRangeValue {
    let value = this.evaluateAst(ast.args[0], formulaAddress)

    if (value instanceof CellError) {
      return this.errorMatrix(value.type)
    } else if (typeof value === 'number') {
      value = SimpleRangeValue.fromScalar(value, this.dependencyGraph)
    } else if (!(value instanceof SimpleRangeValue) || value.isErrorMatrix()) {
      return this.errorMatrix(ErrorType.VALUE)
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
      kernel(value.raw()) as number[][],
      {
        width: matrixSize.width,
        height: matrixSize.height,
      },
      this.dependencyGraph
    )
  }

  private errorMatrix(errorType: ErrorType): SimpleRangeValue {
    return SimpleRangeValue.onlyError(new CellError(errorType), this.dependencyGraph)
  }
}
