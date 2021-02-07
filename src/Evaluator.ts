/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {DateTimeHelper} from './DateTimeHelper'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './DependencyGraph'
import {ErrorMessage} from './error-message'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {Interpreter} from './interpreter/Interpreter'
import {EmptyValue, getRawValue, InterpreterValue} from './interpreter/InterpreterValue'
import {Matrix} from './Matrix'
import {NamedExpressions} from './NamedExpressions'
import {NumberLiteralHelper} from './NumberLiteralHelper'
import {Ast, RelativeDependency} from './parser'
import {Serialization} from './Serialization'
import {Statistics, StatType} from './statistics'

export class Evaluator {
  private interpreter: Interpreter

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly dateHelper: DateTimeHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper,
    private readonly functionRegistry: FunctionRegistry,
    private readonly namedExpressions: NamedExpressions,
    private readonly serialization: Serialization
  ) {
    this.interpreter = new Interpreter(this.dependencyGraph, this.columnSearch, this.config, this.stats, this.dateHelper, this.numberLiteralsHelper, this.functionRegistry, this.namedExpressions, this.serialization)
  }

  public run(): void {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
    })
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = new ContentChanges()

    this.stats.measure(StatType.EVALUATION, () => {
      this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        (vertex: Vertex) => {
          if (vertex instanceof FormulaCellVertex) {
            const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
            const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
            const currentValue = vertex.isComputed() ? vertex.getCellValue() : null
            const newCellValue = this.evaluateAstToCellValue(formula, address)
            vertex.setCellValue(newCellValue)
            if (newCellValue !== currentValue) {
              changes.addChange(newCellValue, address)
              this.columnSearch.change(getRawValue(currentValue), getRawValue(newCellValue), address)
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
            const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
            this.columnSearch.remove(getRawValue(vertex.valueOrNull()), address)
            const error = new CellError(ErrorType.CYCLE, undefined, vertex.address)
            vertex.setCellValue(error)
            changes.addChange(error, vertex.address)
          }
        },
      )
    })
    return changes
  }

  public destroy(): void {
    this.interpreter.destroy()
  }

  public runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): InterpreterValue {
    const tmpRanges: RangeVertex[] = []
    for (const dep of absolutizeDependencies(dependencies, address)) {
      if (dep instanceof AbsoluteCellRange) {
        const range = dep
        if (this.dependencyGraph.getRange(range.start, range.end) === undefined) {
          const rangeVertex = new RangeVertex(range)
          this.dependencyGraph.rangeMapping.setRange(rangeVertex)
          tmpRanges.push(rangeVertex)
        }
      }
    }
    const ret = this.evaluateAstToCellValue(ast, address)

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeRange(rangeVertex)
    })

    return ret
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): void {
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex.address))
      }
    })
    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaCellVertex) {
        const address = vertex.getAddress(this.dependencyGraph.lazilyTransformingAstService)
        const formula = vertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
        const newCellValue = this.evaluateAstToCellValue(formula, address)
        vertex.setCellValue(newCellValue)
        this.columnSearch.add(getRawValue(newCellValue), address)
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

  private evaluateAstToCellValue(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    const interpreterValue = this.interpreter.evaluateAst(ast, formulaAddress)
    if (interpreterValue instanceof SimpleRangeValue) {
      return interpreterValue
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return 0
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
      return new CellError(ErrorType.VALUE, ErrorMessage.CellRangeExpected)
    }
  }
}
