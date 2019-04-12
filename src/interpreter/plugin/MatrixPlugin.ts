import {GPU} from 'gpu.js'
import {
  CellError,
  cellError,
  cellRangeToSimpleCellRange,
  CellValue,
  ErrorType,
  isCellError,
  SimpleCellAddress,
  SimpleCellRange,
} from '../../Cell'
import {generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {Ast, AstNodeType, ProcedureAst} from '../../parser/Ast'
import {Matrix} from '../../Vertex'
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
  }

  private gpu: GPU

  constructor(protected readonly interpreter: Interpreter) {
    super(interpreter)
    this.gpu = new GPU({mode: interpreter.config.gpuMode})
  }

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return cellError(ErrorType.NA)
    }
    const left = ast.args[0]
    const right = ast.args[1]

    if (left.type !== AstNodeType.CELL_RANGE || right.type !== AstNodeType.CELL_RANGE) {
      return cellError(ErrorType.VALUE)
    }
    const leftMatrix = this.evaluateAst(left, formulaAddress)
    const rightMatrix = this.evaluateAst(right, formulaAddress)

    if (isCellError(leftMatrix)) {
      return leftMatrix
    }
    if (isCellError(rightMatrix)) {
      return rightMatrix
    }

    const vertex = this.addressMapping.getCell(formulaAddress) as Matrix

    const kernel = this.gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0
      for (let i = 0; i < width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x as number]
      }
      return sum
    }).setOutput([vertex.width, vertex.height])

    return kernel(leftMatrix, rightMatrix, leftMatrix[0].length) as number[][]
  }

  public transpose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): number[][] | CellError {
    if (ast.args.length !== 1) {
      return cellError(ErrorType.NA)
    }

    const value = this.evaluateAst(ast.args[0], formulaAddress)
    const vertex = this.addressMapping.getCell(formulaAddress) as Matrix

    if (isCellError(value)) {
      return value
    } else {
      const kernel = this.gpu.createKernel(function(a: number[][]) {
        return a[this.thread.x as number][this.thread.y as number]
      }).setOutput([vertex.width, vertex.height])

      return kernel(value) as number[][]
    }
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): number[][] | CellError {
    if (ast.type === AstNodeType.CELL_RANGE) {
      return this.matrixFromRange(cellRangeToSimpleCellRange(ast, formulaAddress))
    }
    const value = super.evaluateAst(ast, formulaAddress)

    if (typeof value === 'number') {
      return [[value]]
    }
    if (this.isMatrix(value)) {
      return value as number[][]
    }

    return cellError(ErrorType.VALUE)
  }

  private isMatrix(value: CellValue) {
    return Array.isArray(value) && Array.isArray(value[0]) // value.every(item => Array.isArray(item));
  }

  private matrixFromRange(range: SimpleCellRange): number[][] | CellError {
    const width = range.end.col - range.start.col + 1
    const result = []

    let i = 0
    let row = []
    for (const cellFromRange of generateCellsFromRangeGenerator(range)) {
      const value = this.addressMapping.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
        ++i
      } else {
        return cellError(ErrorType.VALUE)
      }

      if (i % width === 0) {
        i = 0
        result.push([...row])
        row = []
      }
    }
    return result
  }
}
