import {CellError, ErrorType} from './Cell'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './DependencyGraph'
import {Evaluator} from './Evaluator'
import {Interpreter} from './interpreter/Interpreter'
import {Ast} from './parser'
import {Statistics, StatType} from './statistics/Statistics'
import {Matrix} from './Matrix'
import {InterpreterValue, SimpleRangeValue} from './interpreter/InterpreterValue'

export class SingleThreadEvaluator implements Evaluator {
  private interpreter: Interpreter

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: IColumnSearchStrategy,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.interpreter = new Interpreter(this.dependencyGraph, this.columnSearch, this.config, this.stats)
  }

  public run() {
    this.stats.start(StatType.TOP_SORT)
    const { sorted, cycled } = this.dependencyGraph.topologicalSort()
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
    })
  }

  public partialRun(vertices: Vertex[]) {
    this.stats.measure(StatType.EVALUATION, () => {
      const cycled = this.dependencyGraph.graph.getTopologicallySortedSubgraphFrom(vertices, (vertex: Vertex) => {
        if (vertex instanceof FormulaCellVertex) {
          const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
          const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
          const newCellValue = this.interpreter.evaluateAstToCellValue(formula, address)
          vertex.setCellValue(newCellValue)
          this.columnSearch.change(currentValue, newCellValue, address)
          return (currentValue !== newCellValue)
        } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
          const address = vertex.getAddress()
          const formula = vertex.getFormula() as Ast
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
          const newCellValue = this.interpreter.evaluateAst(formula, address)
          if (newCellValue instanceof SimpleRangeValue && newCellValue.hasOnlyNumbers() && newCellValue.width() === vertex.width && newCellValue.height() === vertex.height) {
            const newCellMatrix = new Matrix(newCellValue.rawNumbers())
            vertex.setCellValue(newCellMatrix)
            this.columnSearch.change(currentValue, newCellMatrix, address)
            return true
          } else if (newCellValue instanceof CellError) {
            vertex.setCellValue(newCellValue)
            this.columnSearch.change(currentValue, newCellValue, address)
            return true
          } else {
            const error = new CellError(ErrorType.VALUE)
            vertex.setCellValue(error)
            this.columnSearch.change(currentValue, error, address)
            return true
          }
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
          return true
        } else {
          return true
        }
      })
      cycled.forEach((vertex: Vertex) => {
        (vertex as FormulaCellVertex).setCellValue(new CellError(ErrorType.CYCLE))
      })
    })
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]) {
    cycled.forEach((vertex: Vertex) => {
      (vertex as FormulaCellVertex).setCellValue(new CellError(ErrorType.CYCLE))
    })
    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
        const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
        const newCellValue = this.interpreter.evaluateAstToCellValue(formula, address)
        vertex.setCellValue(newCellValue)
        this.columnSearch.add(newCellValue, address)
      } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula() as Ast
        const newCellValue = this.interpreter.evaluateAst(formula, address)
        if (newCellValue instanceof SimpleRangeValue && newCellValue.hasOnlyNumbers() && newCellValue.width() === vertex.width && newCellValue.height() === vertex.height) {
          const newCellMatrix = new Matrix(newCellValue.rawNumbers())
          vertex.setCellValue(newCellMatrix)
          this.columnSearch.add(newCellMatrix, address)
        } else if (newCellValue instanceof CellError) {
          vertex.setCellValue(newCellValue)
          this.columnSearch.add(newCellValue, address)
        } else {
          const error = new CellError(ErrorType.VALUE)
          vertex.setCellValue(error)
          this.columnSearch.add(error, address)
        }
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }
}
