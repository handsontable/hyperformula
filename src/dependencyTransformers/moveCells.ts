import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {MoveCellsTransformation} from '../LazilyTransformingAstService'
import {Ast, AstNodeType, CellAddress, ParserWithCaching} from '../parser'
import {CellAddressTransformerFunction, cellRangeTransformer, transformAddressesInFormula} from './common'

export namespace MoveCellsDependencyTransformer {
  export function transform(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      node.getFormula()
      const newAst = transformDependentFormulas(node.getFormula()!, node.getAddress(), sourceRange, toRight, toBottom, toSheet)
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
    }
  }

  export function transformSingleAst(transformation: MoveCellsTransformation, ast: Ast, nodeAddress: SimpleCellAddress): [Ast, SimpleCellAddress] {
    if (transformation.sourceRange.addressInRange(nodeAddress)) {
      const newAst = transformAddressesInFormula(
          ast,
          nodeAddress,
          fixDependenciesInMovedCells(transformation.sourceRange, transformation.toRight, transformation.toBottom),
          cellRangeTransformer(fixDependenciesInMovedCells(transformation.sourceRange, transformation.toRight, transformation.toBottom)),
      )

      return [newAst, {
        sheet: nodeAddress.sheet,
        col: nodeAddress.col + transformation.toRight,
        row: nodeAddress.row + transformation.toBottom,
      }]
    } else {
      const newAst = transformDependentFormulas(ast, nodeAddress, transformation.sourceRange, transformation.toRight, transformation.toBottom, transformation.toSheet)
      return [newAst, nodeAddress]
    }
  }

  function fixDependenciesInMovedCells(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number): CellAddressTransformerFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      const targetRange = sourceRange.shifted(toRight, toBottom)

      const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)

      if (sourceRange.addressInRange(absoluteDependencyAddress)) { // If dependency is internal, move only absolute dimensions
        return dependencyAddress.shiftAbsoluteDimensions(toRight, toBottom)
      } else if (targetRange.addressInRange(absoluteDependencyAddress)) {  // If dependency is external and moved range overrides it return REF
        return ErrorType.REF
      }

      return dependencyAddress.shiftRelativeDimensions(-toRight, -toBottom)
    }
  }

  function fixDependenciesWhenMovingCells(dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    if (sourceRange.addressInRange(dependencyAddress.toSimpleCellAddress(formulaAddress))) {
      return dependencyAddress.moved(toSheet, toRight, toBottom)
    }
    return false
  }

  function transformDependentFormulas(ast: Ast, address: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number): Ast {
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
      case AstNodeType.PERCENT_OP: {
        return {
          type: ast.type,
          value: transformDependentFormulas(ast.value, address, sourceRange, toRight, toBottom, toSheet),
        }
      }
      case AstNodeType.MINUS_UNARY_OP: {
        return {
          type: ast.type,
          value: transformDependentFormulas(ast.value, address, sourceRange, toRight, toBottom, toSheet),
        }
      }
      case AstNodeType.FUNCTION_CALL: {
        return {
          type: ast.type,
          procedureName: ast.procedureName,
          args: ast.args.map((arg) => transformDependentFormulas(arg, address, sourceRange, toRight, toBottom, toSheet)),
        }
      }
      case AstNodeType.PARENTHESIS: {
        return {
          type: ast.type,
          expression: transformDependentFormulas(ast.expression, address, sourceRange, toRight, toBottom, toSheet)
        }
      }
      default: {
        return {
          type: ast.type,
          left: transformDependentFormulas(ast.left, address, sourceRange, toRight, toBottom, toSheet),
          right: transformDependentFormulas(ast.right, address, sourceRange, toRight, toBottom, toSheet),
        } as Ast
      }
    }
  }
}
