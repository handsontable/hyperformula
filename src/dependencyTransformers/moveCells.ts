import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, AstNodeType, CellAddress, ParserWithCaching} from '../parser'
import {transformAddressesInFormula, transformCellRangeByReferences, TransformCellAddressFunction} from './common'

export namespace MoveCellsDependencyTransformer {
  export function transformDependentFormulas(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, ast: Ast, nodeAddress: SimpleCellAddress) {
      return transformAddressesInMovedFormula(
          ast,
          nodeAddress,
          sourceRange,
          toRight,
          toBottom,
          toSheet,
      )
  }

  export function transformMovedFormulas(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.formulaVerticesInRange(sourceRange)) {
      const newAst = transformAddressesInFormula(
          node.getFormula(graph.lazilyTransformingAstService),
          node.getAddress(graph.lazilyTransformingAstService),
          fixDependenciesInMovedCells(-toRight, -toBottom),
          transformCellRangeByReferences(fixDependenciesInMovedCells(-toRight, -toBottom))
      )
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress({
        sheet: node.address.sheet,
        col: node.address.col + toRight,
        row: node.address.row + toBottom,
      })
    }
  }

  function fixDependenciesInMovedCells(toRight: number, toBottom: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, _) => {
      return dependencyAddress.shiftRelativeDimensions(toRight, toBottom)
    }
  }

  function fixDependenciesWhenMovingCells(dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    if (sourceRange.addressInRange(dependencyAddress.toSimpleCellAddress(formulaAddress))) {
      return dependencyAddress.moved(toSheet, toRight, toBottom)
    }
    return false
  }

  function transformAddressesInMovedFormula(ast: Ast, address: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number): Ast {
    switch (ast.type) {
      case AstNodeType.CELL_REFERENCE: {
        const newCellAddress = fixDependenciesWhenMovingCells(ast.reference, address, sourceRange, toRight, toBottom, toSheet)
        if (newCellAddress) {
          return {...ast, reference: newCellAddress}
        } else {
          return ast
        }
      }
      case AstNodeType.CELL_RANGE: {
        const newStart = fixDependenciesWhenMovingCells(ast.start, address, sourceRange, toRight, toBottom, toSheet)
        const newEnd = fixDependenciesWhenMovingCells(ast.end, address, sourceRange, toRight, toBottom, toSheet)
        if (newStart && newEnd) {
          return {
            ...ast,
            start: newStart,
            end: newEnd,
          }
        } else {
          return ast
        }
      }
      case AstNodeType.ERROR:
      case AstNodeType.NUMBER:
      case AstNodeType.STRING: {
        return ast
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return {
          type: ast.type,
          value: transformAddressesInMovedFormula(ast.value, address, sourceRange, toRight, toBottom, toSheet),
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return {
          type: ast.type,
          procedureName: ast.procedureName,
          args: ast.args.map((arg) => transformAddressesInMovedFormula(arg, address, sourceRange, toRight, toBottom, toSheet)),
        }
      }
      default: {
        return {
          type: ast.type,
          left: transformAddressesInMovedFormula(ast.left, address, sourceRange, toRight, toBottom, toSheet),
          right: transformAddressesInMovedFormula(ast.right, address, sourceRange, toRight, toBottom, toSheet),
        } as Ast
      }
    }
  }
}
