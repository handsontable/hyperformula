import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, CellAddress} from '../parser'
import {CellAddressTransformerFunction, cellRangeTransformer, transformAddressesInFormula} from './common'

export namespace RemoveSheetDependencyTransformer {
  export function transform(removedSheet: number, graph: DependencyGraph) {
    for (const node of graph.matrixFormulaNodes()) {
      const newAst = transformSingleAst(removedSheet, node.getFormula()!, node.getAddress())
      node.setFormula(newAst)
    }
  }

  export function transformSingleAst(removedSheet: number, ast: Ast, address: SimpleCellAddress): Ast {
    const transformingFunction = cellAddressTransformer(removedSheet)
    return transformAddressesInFormula(ast, address, transformingFunction, cellRangeTransformer(transformingFunction))
  }

  function cellAddressTransformer(removedSheet: number): CellAddressTransformerFunction {
    return (dependencyAddress: CellAddress, _) => {
      if (dependencyAddress.sheet === removedSheet) {
        return ErrorType.REF
      }
      return false
    }
  }
}
