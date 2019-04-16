import {AbsoluteCellRange} from './AbsoluteCellRange'
import {
  absoluteCellAddress,
  CellDependency,
  cellError, CellRange,
  CellReferenceType, ErrorType,
  getAbsoluteAddress,
  simpleCellAddress,
  SimpleCellAddress,
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

  private ifMatrixCompatibile(leftCorner: FormulaCellVertex, size: MatrixSize): ({ leftMatrix: AbsoluteCellRange, rightMatrix: AbsoluteCellRange }) | false {
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

      const leftArgRange = AbsoluteCellRange.fromCellRange(leftRange, leftCorner.getAddress())
      const rightArgRange = AbsoluteCellRange.fromCellRange(rightRange, leftCorner.getAddress())

      if (leftArgRange.height() === 1 && rightArgRange.width() === 1 && leftArgRange.width() === rightArgRange.height()) {
        const leftMatrix = leftArgRange.withEnd(simpleCellAddress(leftArgRange.start.sheet, leftArgRange.end.col, leftArgRange.end.row + size.height - 1))
        const rightMatrix = rightArgRange.withEnd(simpleCellAddress(rightArgRange.start.sheet, rightArgRange.end.col + size.width - 1, rightArgRange.end.row))
        const currentMatrix = new AbsoluteCellRange(leftCorner.getAddress(), simpleCellAddress(leftCorner.getAddress().sheet, leftCorner.getAddress().col + size.width - 1, leftCorner.getAddress().row + size.height - 1))

        if (!leftMatrix.doesOverlap(currentMatrix) && !rightMatrix.doesOverlap(currentMatrix)) {
          return { leftMatrix, rightMatrix }
        }
      }
    }

    return false
  }

  private buildMultAst(leftMatrix: AbsoluteCellRange, rightMatrix: AbsoluteCellRange): ProcedureAst {
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
