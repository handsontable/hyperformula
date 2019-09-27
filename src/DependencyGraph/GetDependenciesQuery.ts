import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {absolutizeDependencies} from '../absolutizeDependencies'
import {CellDependency} from '../CellDependency'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {collectDependencies} from '../parser'
import {FormulaCellVertex, Vertex} from './'
import {AddressMapping} from './AddressMapping'
import {IGetDependenciesQuery} from './Graph'
import {RangeMapping} from './RangeMapping'

export class GetDependenciesQuery implements IGetDependenciesQuery<Vertex> {
  constructor(
    private readonly rangeMapping: RangeMapping,
    private readonly addressMapping: AddressMapping,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  public call(vertex: Vertex) {
    if (!(vertex instanceof FormulaCellVertex)) {
      return null
    }

    const deps = collectDependencies(vertex.getFormula(this.lazilyTransformingAstService))
    const absoluteDeps = absolutizeDependencies(deps, vertex.getAddress(this.lazilyTransformingAstService))
    return new Set(absoluteDeps.map((dep: CellDependency) => {
      if (dep instanceof AbsoluteCellRange) {
        return this.rangeMapping.fetchRange(dep.start, dep.end)
      } else {
        return this.addressMapping.fetchCell(dep)
      }
    }))
  }
}
