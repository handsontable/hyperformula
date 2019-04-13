import {
  absoluteCellAddress,
  CellDependency,
  cellError, CellRange, cellRangeToSimpleCellRange,
  CellReferenceType, ErrorType,
  getAbsoluteAddress,
  simpleCellAddress,
  SimpleCellAddress,
  SimpleCellRange,
  simpleCellRange,
} from './Cell'
import {Config} from './Config'
import {Graph} from './Graph'
import {IAddressMapping} from './IAddressMapping'
import {checkIfMatrix, checkMatrixSize, MatrixSize, MatrixSizeCheck} from './Matrix'
import {Ast, AstNodeType, buildCellRangeAst, buildProcedureAst, CellRangeAst, ProcedureAst} from './parser/Ast'
import {isFormula, isMatrix, ParserWithCaching} from './parser/ParserWithCaching'
import {RangeMapping} from './RangeMapping'
import {SheetMapping} from './SheetMapping'
import {CellVertex, EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'

export class GraphBuilderMatrixHeuristic {
  constructor(
      private readonly graph: Graph<Vertex>,
      private readonly addressMapping: IAddressMapping,
      private readonly dependencies: Map<Vertex, CellDependency[]>,
      private readonly parser: ParserWithCaching,
  ) {
  }

  public run() {
    const cacheMapping = this.parser.getMapping()

    cacheMapping.forEach((addresses: SimpleCellAddress[], key: string) => {
      const leftCorner = this.addressMapping.getCell(addresses[0])

      const size = checkIfMatrix(addresses)
      if (size && leftCorner instanceof FormulaCellVertex) {
        const output = this.ifMatrixCompatibile(leftCorner, size)
        if (output) {
          const { leftMatrix, rightMatrix } = output
          const newAst = this.buildMultAst(leftMatrix, rightMatrix)
          const matrixVertex = new MatrixVertex(newAst, leftCorner.getAddress(), size.width, size.height)
          const matrixDependencies = this.dependencies.get(leftCorner)!

          addresses.forEach((address) => {
            const vertex = this.addressMapping.getCell(address)
            const deps = this.dependencies.get(vertex)!
            matrixDependencies.push(...deps)
            this.addressMapping.setCell(address, matrixVertex)
            this.dependencies.delete(vertex)
            this.graph.removeNode(vertex)
          })

          this.graph.addNode(matrixVertex)
        }
      }
    })
  }

  private ifMatrixCompatibile(leftCorner: FormulaCellVertex, size: MatrixSize): ({ leftMatrix: SimpleCellRange, rightMatrix: SimpleCellRange }) | false {
    const formula = leftCorner.getFormula()

    if (formula.type === AstNodeType.FUNCTION_CALL && formula.procedureName === 'SUMPROD') {
      if (formula.args.length !== 2) {
        return false
      }

      const [leftArg, rightArg] = formula.args
      let leftRange, rightRange

      if (leftArg.type === AstNodeType.CELL_RANGE && rightArg.type === AstNodeType.FUNCTION_CALL && rightArg.procedureName === 'TRANSPOSE') {
        leftRange = leftArg
        rightRange = rightArg.args[0] as CellRangeAst
      } else if (rightArg.type === AstNodeType.CELL_RANGE && leftArg.type === AstNodeType.FUNCTION_CALL && leftArg.procedureName === 'TRANSPOSE') {
        leftRange = leftArg.args[0] as CellRangeAst
        rightRange = rightArg
      } else {
        return false
      }

      if (leftRange.start.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL
          || leftRange.end.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL
          || rightRange.start.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW
          || rightRange.end.type !== CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW) {
        return false
      }

      const leftArgRange = cellRangeToSimpleCellRange(leftRange, leftCorner.getAddress())
      const rightArgRange = cellRangeToSimpleCellRange(rightRange, leftCorner.getAddress())

      const leftRangeSize = this.rangeSize(leftArgRange)
      const rightRangeSize = this.rangeSize(rightArgRange)

      if (leftRangeSize.height === 1 && rightRangeSize.width === 1 && leftRangeSize.width === rightRangeSize.height) {
        const leftMatrix = simpleCellRange(leftArgRange.start, simpleCellAddress(leftArgRange.start.sheet, leftArgRange.end.col, leftArgRange.end.row + size.height - 1))
        const rightMatrix = simpleCellRange(rightArgRange.start, simpleCellAddress(rightArgRange.start.sheet, rightArgRange.end.col + size.width - 1, rightArgRange.end.row))
        const currentMatrix = simpleCellRange(leftCorner.getAddress(), simpleCellAddress(leftCorner.getAddress().sheet, leftCorner.getAddress().col + size.width - 1, leftCorner.getAddress().row + size.height - 1))

        if (!this.overlap(leftMatrix, currentMatrix) && !this.overlap(rightMatrix, currentMatrix)) {
          return { leftMatrix, rightMatrix }
        }
      }
    }

    return false
  }

  private overlap(left: SimpleCellRange, right: SimpleCellRange) {
    if (left.start.sheet != right.start.sheet) {
      return true
    }
    if (left.end.row < right.start.row || left.start.row > right.end.row) {
      return false
    }
    if (left.end.col < right.start.col || left.start.col > right.end.col) {
      return false
    }
    return true
  }

  private rangeSize(range: SimpleCellRange): MatrixSize {
    return {
      width: range.end.col - range.start.col + 1,
      height: range.end.row - range.start.row + 1,
    }
  }

  private buildMultAst(leftMatrix: SimpleCellRange, rightMatrix: SimpleCellRange): ProcedureAst {
    return buildProcedureAst('MMULT', [
      buildCellRangeAst(
        absoluteCellAddress(leftMatrix.start.sheet, leftMatrix.start.col, leftMatrix.start.row),
        absoluteCellAddress(leftMatrix.end.sheet, leftMatrix.end.col, leftMatrix.end.row),
      ),
      buildCellRangeAst(
        absoluteCellAddress(rightMatrix.start.sheet, rightMatrix.start.col, rightMatrix.start.row),
        absoluteCellAddress(rightMatrix.end.sheet, rightMatrix.end.col, rightMatrix.end.row),
      ),
    ])
  }
}
