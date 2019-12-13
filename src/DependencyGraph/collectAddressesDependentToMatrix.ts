import {RangeVertex} from "./RangeVertex";
import {Vertex} from "./Vertex";
import {AbsoluteCellRange} from "../AbsoluteCellRange";
import {SimpleCellAddress} from "../Cell";
import {FormulaCellVertex} from "./FormulaCellVertex";
import {LazilyTransformingAstService} from "../LazilyTransformingAstService";
import {MatrixVertex} from "./MatrixVertex";
import {Ast, CellAddress, collectDependencies} from "../parser";

export const collectAddressesDependentToMatrix = (vertex: Vertex, matrix: MatrixVertex, lazilyTransformingAstService: LazilyTransformingAstService): SimpleCellAddress[] => {
  const range = matrix.getRange()

  if (vertex instanceof RangeVertex) {
    /* TODO range intersection */
    return [...vertex.range.addresses()].filter(d => range.addressInRange(d))
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

  return collectDependencies(formula)
      .filter(d => !Array.isArray(d))
      .map(d => (d as CellAddress).toSimpleCellAddress(address))
      .filter(d => range.addressInRange(d))
}
