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
import {AsyncPromiseVertex, EmptyValue, getRawValue, OptionalInterpreterTuple} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Operations} from './Operations'
import {Ast, ProcedureAst, RelativeDependency} from './parser'
import {Statistics, StatType} from './statistics'

export class Evaluator {
  constructor(
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly interpreter: Interpreter,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly operations: Operations,
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

  private async recomputeAsyncFunctions(asyncPromiseVertices: AsyncPromiseVertex[]): Promise<ContentChanges> {
    if (!asyncPromiseVertices.length) {
      return ContentChanges.empty()
    }
    
    const asyncPromiseGroupedVertices = this.dependencyGraph.getAsyncGroupedVertices(asyncPromiseVertices)
    
    for (const asyncPromiseGroupedVerticesRow of asyncPromiseGroupedVertices) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const promises = asyncPromiseGroupedVerticesRow.map(({ getPromise }) => getPromise!())
      const interpreterValues = await Promise.all(promises)

      interpreterValues.forEach((value, i) => {
        const vertex = asyncPromiseGroupedVerticesRow[i].asyncVertex as FormulaVertex
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        const ast = vertex.getFormula(this.lazilyTransformingAstService) as ProcedureAst

        // Have to set it before it before for the
        // arraySize check and then again for the new vertex
        vertex.setCellValue(value)

        this.operations.setAsyncFormulaToCell(address, ast, vertex)

        const newVertex = this.dependencyGraph.getCell(address) as FormulaVertex

        newVertex.setCellValue(value)
      })
    }

    const asyncNodes = this.dependencyGraph.asyncVertices()

    // Filter out async nodes as they were just computed
    const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute()).filter(vertex => !asyncNodes.get(vertex))

    const [contentChanges] = this.partialRunWithoutAsync(verticesToRecomputeFrom)

    asyncNodes.forEach((vertex) => {
      const formulaVertex = vertex as FormulaVertex
      const value = formulaVertex.getCellValue()
      const address = formulaVertex.getAddress(this.lazilyTransformingAstService)

      this.columnSearch.add(getRawValue(value), address)
    
      contentChanges.addChange(value, address)
    })

    return contentChanges
  }

  private partialRunWithoutAsync(vertices: Vertex[]): [ContentChanges, Vertex[], AsyncPromiseVertex[]] {
    const changes = ContentChanges.empty()
    const asyncPromiseVertices: AsyncPromiseVertex[] = []

    const { sorted } = this.stats.measure(StatType.EVALUATION, () => {
      return this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        (vertex: Vertex) => {
          if (vertex instanceof FormulaVertex) {
            const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
            const [newCellValue, asyncPromiseVertex] = this.recomputeFormulaVertexValue(vertex)

            if (asyncPromiseVertex) {
              asyncPromiseVertices.push(asyncPromiseVertex)
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

    return [changes, sorted, asyncPromiseVertices]
  }

  public partialRun(vertices: Vertex[]): [ContentChanges, Promise<ContentChanges>] {
    const [changes,, asyncPromiseVertices] = this.partialRunWithoutAsync(vertices)

    return [changes, this.recomputeAsyncFunctions(asyncPromiseVertices)]
  }

  public runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): OptionalInterpreterTuple {
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
    const [ret, asyncPromiseVertex] = this.evaluateAstToCellValue(ast, new InterpreterState(address, this.config.useArrayArithmetic))

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeRange(rangeVertex)
    })

    if (!asyncPromiseVertex) {
      return [ret]
    }

    return [ret, asyncPromiseVertex]
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

    const asyncPromiseVertices: AsyncPromiseVertex[] = []

    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const [newCellValue, asyncPromiseVertex] = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)

        this.columnSearch.add(getRawValue(newCellValue), address)

        if (asyncPromiseVertex) {
          asyncPromiseVertices.push(asyncPromiseVertex)
        }
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })

    return new Promise<void>((resolve, reject) => {
      this.recomputeAsyncFunctions(asyncPromiseVertices).then(() => {
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
    const [interpreterValue, asyncPromiseVertex] = this.interpreter.evaluateAst(ast, state)
    let newAsyncPromiseVertex = asyncPromiseVertex

    if (!asyncPromiseVertex?.getPromise) {
      newAsyncPromiseVertex = undefined
    }

    if (interpreterValue instanceof SimpleRangeValue) {
      return [interpreterValue, newAsyncPromiseVertex]
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return [0, newAsyncPromiseVertex]
    } else {
      return [interpreterValue, newAsyncPromiseVertex]
    }
  }
}
