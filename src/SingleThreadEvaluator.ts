import {CellError, ErrorType} from './Cell'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './DependencyGraph'
import {Evaluator} from './Evaluator'
import {Interpreter} from './interpreter/Interpreter'
import {Ast} from './parser'
import {Statistics, StatType} from './statistics/Statistics'

export class SingleThreadEvaluator implements Evaluator {
  private interpreter: Interpreter

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.interpreter = new Interpreter(this.dependencyGraph, this.config, this.stats)
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
    this.stats.start(StatType.TOP_SORT)
    const { sorted, cycled } = this.dependencyGraph.getTopologicallySortedSubgraphFrom(vertices)
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
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
        const address = vertex.getAddress()
        const formula = vertex.getFormula() as Ast
        const cellValue = this.interpreter.evaluateAst(formula, address)
        vertex.setCellValue(cellValue)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }
}
