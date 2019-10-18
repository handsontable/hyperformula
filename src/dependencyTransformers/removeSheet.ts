import {DependencyGraph} from "../DependencyGraph";
import {Ast, CellAddress} from "../parser";
import {transformAddressesInFormula, TransformCellAddressFunction, transformCellRangeByReferences} from "./common";
import {ErrorType, SimpleCellAddress} from "../Cell";

export namespace RemoveSheetDependencyTransformer {
  export function transform(removedSheet: number, graph: DependencyGraph) {
    for (const node of graph.matrixFormulaNodes()) {
      const newAst = transform2(removedSheet, node.getFormula()!, node.getAddress())
      node.setFormula(newAst)
    }
  }

  export function transform2(removedSheet: number, ast: Ast, address: SimpleCellAddress): Ast {
    const transformingFunction = transformDependencies(removedSheet)
    return transformAddressesInFormula(ast, address, transformingFunction, transformCellRangeByReferences(transformingFunction))
  }

  export function transformDependencies(removedSheet: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, _) => {
      if (dependencyAddress.sheet === removedSheet) {
        return ErrorType.REF
      }
      return false
    }
  }
}
