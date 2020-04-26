/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
import {SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Ast, collectDependencies, NamedExpressionDependency} from '../parser'
import {FormulaCellVertex, MatrixVertex, Vertex} from './'
import {AddressMapping} from './AddressMapping/AddressMapping'
import {IGetDependenciesQuery} from './Graph'
import {RangeMapping} from './RangeMapping'
import {NamedExpressions} from '../NamedExpressions'

export class GetDependenciesQuery implements IGetDependenciesQuery<Vertex> {
  constructor(
    private readonly rangeMapping: RangeMapping,
    private readonly addressMapping: AddressMapping,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>,
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
    } else {
      return null
    }

    const deps = collectDependencies(formula!, this.functionsWhichDoesNotNeedArgumentsToBeComputed)
    const absoluteDeps = absolutizeDependencies(deps, address)
    return new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping.fetchRange(dep.start, dep.end)
      } else if (dep instanceof NamedExpressionDependency) {
        const address = this.namedExpressions.getInternalMaybeNotAddedNamedExpressionAddress(dep.name)
        return this.addressMapping.fetchCell(address)
      } else {
        return this.addressMapping.fetchCell(dep)
      }
    }))
  }
}
