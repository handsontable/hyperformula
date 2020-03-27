import {SimpleCellAddress} from '../Cell'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Ast, CellAddress, collectDependencies} from '../parser'
import {FormulaCellVertex} from './FormulaCellVertex'
import {MatrixVertex} from './MatrixVertex'
import {RangeVertex} from './RangeVertex'
import {Vertex} from './Vertex'
import {DependencyGraph} from './DependencyGraph'
import {RelativeDependencyType} from '../parser/RelativeDependency'

export const collectAddressesDependentToMatrix = (functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>, vertex: Vertex, matrix: MatrixVertex, lazilyTransformingAstService: LazilyTransformingAstService, dependencyGraph: DependencyGraph): SimpleCellAddress[] => {
  const range = matrix.getRange()

  if (vertex instanceof RangeVertex) {
    /* TODO range intersection */
    return [...vertex.range.addresses(dependencyGraph)].filter((d) => range.addressInRange(d))
  }

  let formula: Ast
  let address: SimpleCellAddress

  if (vertex instanceof FormulaCellVertex) {
    formula = vertex.getFormula(lazilyTransformingAstService)
    address = vertex.getAddress(lazilyTransformingAstService)
  } else if (vertex instanceof MatrixVertex && vertex.isFormula()) {
    formula = vertex.getFormula()!
    address = vertex.getAddress()
  } else {
    return []
  }

  return collectDependencies(formula, functionsWhichDoesNotNeedArgumentsToBeComputed)
    .filter((d) => d.type === RelativeDependencyType.CellAddress)
    .map((d) => (d.dependency as CellAddress).toSimpleCellAddress(address))
    .filter((d) => range.addressInRange(d))
}
