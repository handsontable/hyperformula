/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Ast, collectDependencies, NamedExpressionDependency} from '../parser'
import {FormulaCellVertex, MatrixVertex, RangeVertex, Vertex} from './'
import {AddressMapping} from './AddressMapping/AddressMapping'
import {IGetDependenciesQuery} from './Graph'
import {RangeMapping} from './RangeMapping'
import {NamedExpressions} from '../NamedExpressions'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'

export class GetDependenciesQuery implements IGetDependenciesQuery<Vertex> {
  constructor(
    private readonly rangeMapping: RangeMapping,
    private readonly addressMapping: AddressMapping,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly functionRegistry: FunctionRegistry,
    private readonly namedExpressions: NamedExpressions,
  ) {
  }

  public call(vertex: Vertex) {
    let formula: Ast
    let address: SimpleCellAddress

    if (vertex instanceof FormulaCellVertex) {
      address = vertex.getAddress(this.lazilyTransformingAstService)
      formula = vertex.getFormula(this.lazilyTransformingAstService)
    } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
      address = vertex.getAddress()
      formula = vertex.getFormula()!
    } else if (vertex instanceof RangeVertex) {
      const {smallerRangeVertex} = this.rangeMapping.findSmallerRange(vertex.range)
      if(smallerRangeVertex !== null) {
        const endVertex = vertex.range.end
        const startVertex = simpleCellAddress(vertex.range.start.sheet, vertex.range.start.col, endVertex.row)
        const allDeps = new Set(this.rangeMapping.rangeVerticesContainedInRange(new AbsoluteCellRange(startVertex,endVertex)))
        allDeps.add(smallerRangeVertex)
        return allDeps
      } else {
        return new Set(this.rangeMapping.rangeVerticesContainedInRange(vertex.range))
      }
    } else {
      return null
    }

    const deps = collectDependencies(formula!, this.functionRegistry)
    const absoluteDeps = absolutizeDependencies(deps, address)
    return new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping.fetchRange(dep.start, dep.end)
      } else if (dep instanceof NamedExpressionDependency) {
        const namedExpression = this.namedExpressions.namedExpressionOrPlaceholder(dep.name, address.sheet)
        return this.addressMapping.fetchCell(namedExpression.address)
      } else {
        return this.addressMapping.fetchCell(dep)
      }
    }))
  }
}
