import {Ast} from './parser'
import {Config} from './Config'
import {AddressMapping, SerializedMapping} from './AddressMapping'
import {RangeMapping} from './RangeMapping'
import {Graph} from './Graph'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex, RangeVertex, ValueCellVertex, Vertex} from './Vertex'
import {Evaluator} from './Evaluator'
import {
  CellError,
  CellValue,
  ErrorType,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {Statistics, StatType} from './statistics/Statistics'
import {Interpreter} from './interpreter/Interpreter'

export class SingleThreadEvaluator implements Evaluator {
  /** Topologically sorted list of vertices. */
  private sortedVertices: Vertex[] = []

  /** List of vertices which are on some cycle */
  private verticesOnCycle: Vertex[] = []

  private interpreter: Interpreter

  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly config: Config,
    private readonly stats: Statistics,
  ) {
    this.interpreter = new Interpreter(this.addressMapping, this.rangeMapping, this.graph, this.config)
  }

  public async run() {
    this.stats.measure(StatType.TOP_SORT, () => {
      ({ sorted: this.sortedVertices, cycled: this.verticesOnCycle } = this.graph.topologicalSort())
    })

    this.recomputeFormulas()
  }

  /**
   * Recalculates formulas in the topological sort order
    */
    private recomputeFormulas() {
      this.verticesOnCycle.forEach((vertex: Vertex) => {
        (vertex as FormulaCellVertex).setCellValue(new CellError(ErrorType.CYCLE))
      })
      this.sortedVertices.forEach((vertex: Vertex) => {
        if (vertex instanceof FormulaCellVertex || (vertex instanceof MatrixVertex && vertex.isFormula())) {
          const address = vertex.getAddress()
          const formula = vertex.getFormula() as Ast
          const cellValue = this.interpreter.evaluateAst(formula, address)
          vertex.setCellValue(cellValue)
        } else if (vertex instanceof RangeVertex) {
          vertex.clear()
        }
      })
    }
}
