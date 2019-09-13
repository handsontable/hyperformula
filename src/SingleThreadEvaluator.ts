import {CellError, ErrorType} from './Cell'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './DependencyGraph'
import {Evaluator} from './Evaluator'
import {Interpreter} from './interpreter/Interpreter'
import {Ast} from './parser'
import {Statistics, StatType} from './statistics/Statistics'
import {ColumnIndex} from "./ColumnIndex";

export class SingleThreadEvaluator implements Evaluator {
  private interpreter: Interpreter

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnIndex: ColumnIndex,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.interpreter = new Interpreter(this.dependencyGraph, this.columnIndex, this.config, this.stats)
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
        if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
          let address, formula
          if (vertex instanceof FormulaCellVertex) {
            address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
            formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService) as Ast
          } else {
            address = vertex.getAddress()
            formula = vertex.getFormula() as Ast
          }
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
          const newCellValue = this.interpreter.evaluateAst(formula, address)
          vertex.setCellValue(newCellValue)
          this.columnIndex.change(currentValue, newCellValue, address)
          return (currentValue !== newCellValue)
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
      if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
        let address, formula
        if (vertex instanceof FormulaCellVertex) {
          address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
          formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService) as Ast
        } else {
          address = vertex.getAddress()
          formula = vertex.getFormula() as Ast
        }
        const cellValue = this.interpreter.evaluateAst(formula, address)
        vertex.setCellValue(cellValue)
        this.columnIndex.add(cellValue, address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }
}
