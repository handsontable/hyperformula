/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {ArrayVertex, DependencyGraph, RangeVertex, Vertex} from './DependencyGraph'
import {FormulaVertex} from './DependencyGraph/FormulaCellVertex'
import {Interpreter} from './interpreter/Interpreter'
import {InterpreterState} from './interpreter/InterpreterState'
import {EmptyValue, getRawValue, InterpreterValue, OptionalInterpreterTuple} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Ast, RelativeDependency} from './parser'
import { AsyncFunctionValue } from './parser/Ast'
import {Statistics, StatType} from './statistics'

export class Evaluator {
  constructor(
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly interpreter: Interpreter,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
  ) {
  }

  public run(): Promise<void> {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    return this.stats.measure(StatType.EVALUATION, () => {
      return this.recomputeFormulas(cycled, sorted)
    })
  }

  private async recomputeAsyncFunctions(asyncFunctionValuePromise: Promise<AsyncFunctionValue>[], sortedVertices: Vertex[]): Promise<ContentChanges> {
    const changes = ContentChanges.empty()

    const addNewValueToChanges = (address: SimpleCellAddress, currentValue: InterpreterValue | undefined, value: InterpreterValue) => {
      changes.addChange(value, address)

      this.columnSearch.change(getRawValue(currentValue), getRawValue(value), address)
    }

    for (const promise of asyncFunctionValuePromise) {
      const asyncFunctionValue = await promise
      const { state, interpreterValue } = asyncFunctionValue

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const formulaVertex = state.formulaVertex!
  
      formulaVertex.setCellValue(interpreterValue)

      const indexOfNext = sortedVertices.indexOf(formulaVertex) + 1
      const currentValue = formulaVertex.isComputed() ? formulaVertex.getCellValue() : undefined
      const address = formulaVertex.getAddress(this.lazilyTransformingAstService)

      addNewValueToChanges(address, currentValue, interpreterValue)

      // TODO: Not efficient algorithm code
      for (let index = indexOfNext; index < sortedVertices.length; index++) {
        const vertex = sortedVertices[index]

        if (vertex instanceof FormulaVertex) {
          const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
          const [newCellValue] = this.recomputeFormulaVertexValue(vertex)

          if (newCellValue !== currentValue) {
            const address = vertex.getAddress(this.lazilyTransformingAstService)

            addNewValueToChanges(address, currentValue, newCellValue)
          }
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
      }
    }

    return changes
  }

  private partialRunWithoutAsync(vertices: Vertex[]): [ContentChanges, Vertex[], Promise<AsyncFunctionValue>[]] {
    const changes = ContentChanges.empty()
    const promises: Promise<AsyncFunctionValue>[] = []

    const { sorted } = this.stats.measure(StatType.EVALUATION, () => {
      return this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        (vertex: Vertex) => {
          if (vertex instanceof FormulaVertex) {
            const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
            const [newCellValue, promise] = this.recomputeFormulaVertexValue(vertex)

            if (promise) {
              promises.push(promise)
            }

            if (newCellValue !== currentValue) {
              const address = vertex.getAddress(this.lazilyTransformingAstService)
              changes.addChange(newCellValue, address)
              this.columnSearch.change(getRawValue(currentValue), getRawValue(newCellValue), address)
              return true
            }
            return false
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
          } else if (vertex instanceof FormulaVertex) {
            const address = vertex.getAddress(this.lazilyTransformingAstService)
            this.columnSearch.remove(getRawValue(vertex.valueOrUndef()), address)
            const error = new CellError(ErrorType.CYCLE, undefined, vertex)
            vertex.setCellValue(error)
            changes.addChange(error, address)
          }
        },
      )
    })

    return [changes, sorted, promises]
  }

  public partialRun(vertices: Vertex[]): [ContentChanges, Promise<ContentChanges>] {
    const [changes, sorted, promises] = this.partialRunWithoutAsync(vertices)

    return [changes, this.recomputeAsyncFunctions(promises, sorted)]
  }

  public runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): [InterpreterValue, Promise<InterpreterValue>] {
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
    const [ret, asyncFunctionValuePromise] = this.evaluateAstToCellValue(ast, new InterpreterState(address, this.config.useArrayArithmetic))

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeRange(rangeVertex)
    })

    const promise = new Promise<InterpreterValue>((resolve, reject) => {
      asyncFunctionValuePromise?.then(({ interpreterValue }) => {
        resolve(interpreterValue)
      }).catch(reject)
    })

    return [ret, promise]
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): Promise<void> {
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex))
      }
    })

    const promises: Promise<AsyncFunctionValue>[] = []

    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const [newCellValue, promise] = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)

        this.columnSearch.add(getRawValue(newCellValue), address)

        if (promise) {
          promises.push(promise)
        }
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })

    return new Promise<void>((resolve, reject) => {
      this.recomputeAsyncFunctions(promises, sorted).then(() => {
        resolve(undefined)
      }).catch(reject)
    })
  }

  private recomputeFormulaVertexValue(vertex: FormulaVertex): OptionalInterpreterTuple {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    if (vertex instanceof ArrayVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
      return [vertex.setNoSpace()]
    } else {
      const formula = vertex.getFormula(this.lazilyTransformingAstService)
      const [newCellValue, promise] = this.evaluateAstToCellValue(formula, new InterpreterState(address, this.config.useArrayArithmetic, vertex))
      
      return [vertex.setCellValue(newCellValue), promise]
    }
  }

  private evaluateAstToCellValue(ast: Ast, state: InterpreterState): OptionalInterpreterTuple {
    const [interpreterValue, promise] = this.interpreter.evaluateAst(ast, state)

    if (interpreterValue instanceof SimpleRangeValue) {
      return [interpreterValue, promise]
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return [0, promise]
    } else {
      return [interpreterValue, promise]
    }
  }
}
