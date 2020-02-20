import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from './Cell'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {DateHelper} from './DateHelper'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './DependencyGraph'
import {Evaluator} from './Evaluator'
import {Interpreter} from './interpreter/Interpreter'
import {SimpleRangeValue} from './interpreter/InterpreterValue'
import {Matrix} from './Matrix'
import {Ast} from './parser'
import {Statistics, StatType} from './statistics/Statistics'

export class SingleThreadEvaluator implements Evaluator {
  private interpreter: Interpreter

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: IColumnSearchStrategy,
    private readonly config: Config,
    private readonly stats: Statistics,
    private readonly dateHelper: DateHelper,
  ) {
    this.interpreter = new Interpreter(this.dependencyGraph, this.columnSearch, this.config, this.stats, this.dateHelper)
  }

  public run() {
    this.stats.start(StatType.TOP_SORT)
    const { sorted, cycled } = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
    })
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = new ContentChanges()

    this.stats.measure(StatType.EVALUATION, () => {
      const cycled = this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(new Set(vertices),
        (vertex: Vertex) => {
        if (vertex instanceof FormulaCellVertex) {
          const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
          const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
          const newCellValue = this.evaluateAstToScalarValue(formula, address)
          vertex.setCellValue(newCellValue)
          if (newCellValue !== currentValue) {
            changes.addChange(newCellValue, address)
            this.columnSearch.change(currentValue, newCellValue, address)
            return true
          }
          return false
        } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
          const address = vertex.getAddress()
          const formula = vertex.getFormula() as Ast
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
          const newCellValue = this.evaluateAstToRangeValue(formula, address)
          if (newCellValue instanceof SimpleRangeValue) {
            const newCellMatrix = new Matrix(newCellValue.rawNumbers())
            vertex.setCellValue(newCellMatrix)
            changes.addMatrixChange(newCellMatrix, address)
            this.columnSearch.change(currentValue, newCellMatrix, address)
          } else {
            vertex.setErrorValue(newCellValue)
            changes.addChange(newCellValue, address)
            this.columnSearch.change(currentValue, newCellValue, address)
          }
          return true
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
          return true
        } else {
          return true
        }
      },
        (vertex: Vertex) => {
          if (vertex instanceof RangeVertex) {
            vertex.clearCache()
          } else if (vertex instanceof FormulaCellVertex) {
            const error = new CellError(ErrorType.CYCLE)
            vertex.setCellValue(error)
            changes.addChange(error, vertex.address)
          }
        },
        )
    })
    return changes
  }

  public destroy() {
    this.interpreter.destroy()
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]) {
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof  FormulaCellVertex) {
        vertex.setCellValue(new CellError(ErrorType.CYCLE))
      }
    })
    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
        const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
        const newCellValue = this.evaluateAstToScalarValue(formula, address)
        vertex.setCellValue(newCellValue)
        this.columnSearch.add(newCellValue, address)
      } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
        const address = vertex.getAddress()
        const formula = vertex.getFormula() as Ast
        const newCellValue = this.evaluateAstToRangeValue(formula, address)
        if (newCellValue instanceof SimpleRangeValue) {
          const newCellMatrix = new Matrix(newCellValue.rawNumbers())
          vertex.setCellValue(newCellMatrix)
          this.columnSearch.add(newCellMatrix, address)
        } else {
          vertex.setErrorValue(newCellValue)
          this.columnSearch.add(newCellValue, address)
        }
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }

  private evaluateAstToScalarValue(ast: Ast, formulaAddress: SimpleCellAddress): InternalCellValue {
    const interpreterValue = this.interpreter.evaluateAst(ast, formulaAddress)
    if (interpreterValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else {
      return interpreterValue
    }
  }

  private evaluateAstToRangeValue(ast: Ast, formulaAddress: SimpleCellAddress): SimpleRangeValue | CellError {
    const interpreterValue = this.interpreter.evaluateAst(ast, formulaAddress)
    if (interpreterValue instanceof CellError) {
      return interpreterValue
    } else if (interpreterValue instanceof SimpleRangeValue && interpreterValue.hasOnlyNumbers()) {
      return interpreterValue
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }
}
