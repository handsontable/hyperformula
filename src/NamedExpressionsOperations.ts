/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {
  AddressMapping,
  CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  SparseStrategy,
  ValueCellVertex
} from './DependencyGraph'
import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {doesContainRelativeReferences, NamedExpressions} from './NamedExpressions'
import {NoRelativeAddressesAllowedError} from './errors'
import {absolutizeDependencies} from './absolutizeDependencies'
import {AbsoluteCellRange} from './AbsoluteCellRange'
import {NamedExpressionDependency, ParserWithCaching, RelativeDependency} from './parser'
import {Operations} from './Operations'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'

export class NamedExpressionsOperations {
  constructor(
    private dependencyGraph: DependencyGraph,
    private cellContentParser: CellContentParser,
    private parser: ParserWithCaching,
    private operations: Operations,
    private namedExpressions: NamedExpressions,
    private lazilyTransformingAstService: LazilyTransformingAstService
  ) {
    this.allocateNamedExpressionAddressSpace()
  }

  public storeNamedExpressionInCell(address: SimpleCellAddress, expression: RawCellContent) {
    const parsedCellContent = this.cellContentParser.parse(expression)

    if (parsedCellContent instanceof CellContent.MatrixFormula) {
      throw new Error('Matrix formulas are not supported')
    } else if (parsedCellContent instanceof CellContent.Formula) {
      const parsingResult = this.parser.parse(parsedCellContent.formula, simpleCellAddress(-1, 0, 0))
      if (doesContainRelativeReferences(parsingResult.ast)) {
        throw new NoRelativeAddressesAllowedError()
      }
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = parsingResult
      this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    } else {

      if (parsedCellContent instanceof CellContent.Empty) {
        this.operations.setCellEmpty(address)
      } else {
        this.operations.setValueToCell(parsedCellContent.value, address)
      }
    }
  }

  public updateNamedExpressionsForMovedCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    if (sourceLeftCorner.sheet === destinationLeftCorner.sheet) {
      return
    }

    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    for (const formulaAddress of targetRange.addresses(this.dependencyGraph)) {
      const vertex = this.addressMapping.fetchCell(formulaAddress)
      if (vertex instanceof FormulaCellVertex && formulaAddress.sheet !== sourceLeftCorner.sheet) {
        const ast = vertex.getFormula(this.lazilyTransformingAstService)
        const {dependencies} = this.parser.fetchCachedResultForAst(ast)
        this.updateNamedExpressionsForTargetAddress(sourceLeftCorner.sheet, formulaAddress, dependencies)
      }
    }
  }

  public updateNamedExpressionsForTargetAddress(sourceSheet: number, targetAddress: SimpleCellAddress, dependencies: RelativeDependency[]) {
    if (sourceSheet === targetAddress.sheet) {
      return
    }

    const vertex = this.addressMapping.fetchCell(targetAddress)

    for (const namedExpressionDependency of absolutizeDependencies(dependencies, targetAddress)) {
      if (!(namedExpressionDependency instanceof NamedExpressionDependency)) {
        continue
      }

      const expressionName = namedExpressionDependency.name
      const sourceVertex = this.dependencyGraph.fetchNamedExpressionVertex(expressionName, sourceSheet)
      const namedExpressionInTargetScope = this.namedExpressions.isExpressionInScope(expressionName, targetAddress.sheet)

      const targetScopeExpressionVertex = namedExpressionInTargetScope
        ? this.dependencyGraph.fetchNamedExpressionVertex(expressionName, targetAddress.sheet)
        : this.copyOrFetchGlobalNamedExpressionVertex(expressionName, sourceVertex)

      if (targetScopeExpressionVertex !== sourceVertex) {
        this.dependencyGraph.graph.softRemoveEdge(sourceVertex, vertex)
        this.dependencyGraph.graph.addEdge(targetScopeExpressionVertex, vertex)
      }
    }
  }

  private allocateNamedExpressionAddressSpace() {
    this.dependencyGraph.addressMapping.addSheet(-1, new SparseStrategy(0, 0))
  }

  private copyOrFetchGlobalNamedExpressionVertex(expressionName: string, sourceVertex: CellVertex): CellVertex {
    let expression = this.namedExpressions.namedExpressionForScope(expressionName)
    if (expression === undefined) {
      expression = this.namedExpressions.addNamedExpression(expressionName)
      if (sourceVertex instanceof FormulaCellVertex) {
        const parsingResult = this.parser.fetchCachedResultForAst(sourceVertex.getFormula(this.lazilyTransformingAstService))
        const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = parsingResult
        this.dependencyGraph.setFormulaToCell(expression.address, ast, absolutizeDependencies(dependencies, expression.address), hasVolatileFunction, hasStructuralChangeFunction)
      } else if (sourceVertex instanceof EmptyCellVertex) {
        this.operations.setCellEmpty(expression.address)
      } else if (sourceVertex instanceof ValueCellVertex) {
        this.operations.setValueToCell(sourceVertex.getCellValue(), expression.address)
      }
    }
    return this.dependencyGraph.fetchCellOrCreateEmpty(expression.address)
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }
}