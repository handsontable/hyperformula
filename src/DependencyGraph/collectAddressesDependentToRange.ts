/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {AddressDependency, Ast, collectDependencies} from '../parser'
import {FormulaVertex} from './FormulaCellVertex'
import {RangeVertex} from './RangeVertex'
import {Vertex} from './Vertex'
import {DependencyGraph} from './DependencyGraph'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

export const collectAddressesDependentToRange = (funcitonRegistry: FunctionRegistry, vertex: Vertex, range: AbsoluteCellRange, lazilyTransformingAstService: LazilyTransformingAstService, dependencyGraph: DependencyGraph): SimpleCellAddress[] => {
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

  if (vertex instanceof FormulaVertex) {
    formula = vertex.getFormula(lazilyTransformingAstService)
    address = vertex.getAddress(lazilyTransformingAstService)
  } else {
    return []
  }

  return collectDependencies(formula, funcitonRegistry)
    .filter((d): d is AddressDependency => d instanceof AddressDependency)
    .map((d) => d.dependency.toSimpleCellAddress(address))
    .filter((d) => range.addressInRange(d))
}
