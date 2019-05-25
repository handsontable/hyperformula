import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {checkMatrixSize, Matrix} from '../../Matrix'
import {Ast, AstNodeType, ProcedureAst} from '../../parser/Ast'
import {MatrixVertex} from '../../Vertex'
import {Interpreter} from '../Interpreter'
import {FunctionPlugin} from './FunctionPlugin'

export class MatrixPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    mmult: {
      EN: 'MMULT',
      PL: 'MACIERZ.ILOCZYN',
    },
    transpose: {
      EN: 'TRANSPOSE',
      PL: 'TRANSPONUJ',
    },
    maxpool: {
      EN: 'MAXPOOL',
      PL: 'MAKS.Z.PULI',
    },
    medianpool: {
      EN: 'MEDIANPOOL',
      PL: 'MEDIANA.Z.PULI',
    },
  }

  constructor(protected readonly interpreter: Interpreter) {
    super(interpreter)
  }

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const left = ast.args[0]
    const right = ast.args[1]

    if (left.type !== AstNodeType.CELL_RANGE || right.type !== AstNodeType.CELL_RANGE) {
      return new CellError(ErrorType.VALUE)
    }
    const leftMatrix = this.evaluateAst(left, formulaAddress)
    const rightMatrix = this.evaluateAst(right, formulaAddress)

    if (leftMatrix instanceof CellError) {
      return leftMatrix
    }
    if (rightMatrix instanceof CellError) {
      return rightMatrix
    }

    const vertex = this.addressMapping.getCell(formulaAddress) as MatrixVertex

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0
      for (let i = 0; i < width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x as number]
      }
      return sum
    }).setOutput([vertex.width, vertex.height])

    return new Matrix(kernel(leftMatrix.raw(), rightMatrix.raw(), leftMatrix.width()) as number[][])
  }

  public maxpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): Matrix | CellError {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA)
    }
    const [rangeArg, sizeArg] = ast.args

    if (sizeArg.type !== AstNodeType.NUMBER) {
      return new CellError(ErrorType.VALUE)
    }

    const rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
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

    return new Matrix(kernel(rangeMatrix.raw(), windowSize, stride) as number[][])
  }

  public medianpool(ast: ProcedureAst, formulaAddress: SimpleCellAddress): Matrix | CellError {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA)
    }
    const [rangeArg, sizeArg] = ast.args

    if (sizeArg.type !== AstNodeType.NUMBER) {
      return new CellError(ErrorType.VALUE)
    }

    const rangeMatrix = this.evaluateAst(rangeArg, formulaAddress)
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
        let medianGuess = (leftEnd + rightEnd) / 2
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

    return new Matrix(kernel(rangeMatrix.raw(), windowSize, stride) as number[][])
  }

  public transpose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): Matrix | CellError {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const value = this.evaluateAst(ast.args[0], formulaAddress)

    if (value instanceof CellError) {
      return value
    }

    const matrixSize = checkMatrixSize(ast, formulaAddress)
    if (!matrixSize) {
      return new CellError(ErrorType.VALUE)
    }

    /* istanbul ignore next: gpu.js */
    const kernel = this.interpreter.gpu.createKernel(function(a: number[][]) {
      return a[this.thread.x as number][this.thread.y as number]
    }).setOutput([matrixSize.width, matrixSize.height])

    return new Matrix(kernel(value.raw()) as number[][])
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): Matrix | CellError {
    if (ast.type === AstNodeType.CELL_RANGE) {
      const range = AbsoluteCellRange.fromCellRange(ast, formulaAddress)
      const matrixVertex = this.addressMapping.getMatrix(range)
      if (matrixVertex !== undefined) {
        return matrixVertex.getCellValue()
      }
      return this.matrixFromRange(range)
    }
    const value = super.evaluateAst(ast, formulaAddress)

    if (typeof value === 'number') {
      return new Matrix([[value]])
    } else if (value instanceof Matrix) {
      return value
    }

    return new CellError(ErrorType.VALUE)
  }

  private matrixFromRange(range: AbsoluteCellRange): Matrix | CellError {
    const result = []

    let i = 0
    let row = []
    for (const cellFromRange of range.generateCellsFromRangeGenerator()) {
      const value = this.addressMapping.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
        ++i
      } else {
        return new CellError(ErrorType.VALUE)
      }

      if (i % range.width() === 0) {
        i = 0
        result.push([...row])
        row = []
      }
    }
    return new Matrix(result)
  }
}
