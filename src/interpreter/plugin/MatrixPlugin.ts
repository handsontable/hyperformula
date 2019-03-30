import {FunctionPlugin} from './FunctionPlugin'
import {AstNodeType, ProcedureAst} from "../../parser/Ast";
import {
  cellError,
  CellRange,
  cellRangeToSimpleCellRange,
  CellValue,
  ErrorType,
  SimpleCellAddress,
  SimpleCellRange
} from "../../Cell";
import {generateCellsFromRangeGenerator} from "../../GraphBuilder";
import {MatrixCellVertex} from "../../Vertex";
import {Interpreter} from "../Interpreter";
import {GPU} from "gpu.js";

export class MatrixPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    mmult: {
      EN: 'MMULT',
      PL: 'MACIERZ.ILOCZYN',
    },
  }

  private gpu: GPU

  constructor(protected readonly interpreter: Interpreter) {
    super(interpreter)
    this.gpu = new GPU()
  }

  public mmult(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 2) {
      return cellError(ErrorType.NA)
    }

    const leftRange = ast.args[0]
    const rightRange = ast.args[1]

    if (leftRange.type !== AstNodeType.CELL_RANGE || rightRange.type !== AstNodeType.CELL_RANGE) {
      return cellError(ErrorType.VALUE)
    }

    const leftMatrix = this.matrixFromRange(cellRangeToSimpleCellRange(leftRange, formulaAddress))
    const rightMatrix = this.matrixFromRange(cellRangeToSimpleCellRange(rightRange, formulaAddress))

    const vertex = this.addressMapping.getCell(formulaAddress) as MatrixCellVertex

    const width = vertex.matrix.width
    const height = vertex.matrix.height

    const kernel = this.gpu.createKernel(function(a: number[][], b: number[][], width: number) {
      let sum = 0;
      for (let i=0; i<width; ++i) {
        sum += a[this.thread.y as number][i] * b[i][this.thread.x as number];
      }
      return sum
    }).setOutput([width, height]);

    const output = kernel(leftMatrix, rightMatrix, leftMatrix[0].length) as number[][]
    return output
  }

  private matrixFromRange(range: SimpleCellRange): number[][] {
    const width = range.end.col - range.start.col + 1
    const result = []

    let i=0
    let row = []
    for (const cellFromRange of generateCellsFromRangeGenerator(range)) {
      row.push(this.addressMapping.getCell(cellFromRange).getCellValue() as number)
      ++i

      if (i % width === 0) {
        i=0
        result.push([...row])
        row = []
      }
    }

    return result
  }
}
