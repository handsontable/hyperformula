/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {LazilyTransformingAstService} from '../LazilyTransformingAstService'
import {AddressDependency, Ast, collectDependencies} from '../parser'
import {DependencyGraph} from './DependencyGraph'
import {FormulaVertex} from './FormulaCellVertex'
import {RangeVertex} from './RangeVertex'
import {Vertex} from './Vertex'

export const collectAddressesDependentToRange = (functionRegistry: FunctionRegistry, vertex: Vertex, range: AbsoluteCellRange, lazilyTransformingAstService: LazilyTransformingAstService, dependencyGraph: DependencyGraph): SimpleCellAddress[] => {
  if (vertex instanceof RangeVertex) {
    const intersection = vertex.range.intersectionWith(range)
    if (intersection !== undefined) {
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

  return collectDependencies(formula, functionRegistry)
    .filter((d): d is AddressDependency => d instanceof AddressDependency)
    .map((d) => d.dependency.toSimpleCellAddress(address))
    .filter((d) => range.addressInRange(d))
}
