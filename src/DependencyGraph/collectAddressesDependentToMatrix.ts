/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {Ast, CellAddress, collectDependencies, AddressDependency} from '../parser'
import {FormulaCellVertex} from './FormulaCellVertex'
import {MatrixVertex} from './MatrixVertex'
import {RangeVertex} from './RangeVertex'
import {Vertex} from './Vertex'
import {DependencyGraph} from './DependencyGraph'

export const collectAddressesDependentToMatrix = (functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>, vertex: Vertex, matrix: MatrixVertex, lazilyTransformingAstService: LazilyTransformingAstService, dependencyGraph: DependencyGraph): SimpleCellAddress[] => {
  const range = matrix.getRange()

  if (vertex instanceof RangeVertex) {
    const intersection = vertex.range.intersectionWith(range)
    if (intersection !== null) {
      return Array.from(intersection.addresses(dependencyGraph))
    } else {
      return []
    }
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
    .filter((d): d is AddressDependency => d instanceof AddressDependency)
    .map((d) => d.dependency.toSimpleCellAddress(address))
    .filter((d) => range.addressInRange(d))
}
