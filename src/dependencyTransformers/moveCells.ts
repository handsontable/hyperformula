import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, AstNodeType, CellAddress, ParserWithCaching} from '../parser'
import {transformAddressesInFormula, TransformCellAddressFunction, transformCellRangeByReferences} from './common'

export namespace MoveCellsDependencyTransformer {
  export function transform(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, graph: DependencyGraph, parser: ParserWithCaching) {
    transformMatrices(sourceRange, toRight, toBottom, toSheet, graph, parser)
    transformMovedFormulas(sourceRange, toRight, toBottom, toSheet, graph, parser)
  }

  function transformMatrices(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.matrixFormulaNodes()) {
      node.getFormula()
      const newAst = transformDependentFormulas(node.getFormula()!, node.getAddress(), sourceRange, toRight, toBottom, toSheet)
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
    }
  }

  function transformMovedFormulas(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number, graph: DependencyGraph, parser: ParserWithCaching) {
    for (const node of graph.formulaVerticesInRange(sourceRange)) {
      const newAst = transformAddressesInFormula(
          node.getFormula(graph.lazilyTransformingAstService),
          node.getAddress(graph.lazilyTransformingAstService),
          fixDependenciesInMovedCells(sourceRange, toRight, toBottom),
          transformCellRangeByReferences(fixDependenciesInMovedCells(sourceRange, toRight, toBottom))
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

  function fixDependenciesInMovedCells(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number): TransformCellAddressFunction {
    return (dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress) => {
      const targetRange = sourceRange.shifted(toRight, toBottom)

      /* If dependency is external and moved range overrides it return REF */
      const absoluteDependencyAddress = dependencyAddress.toSimpleCellAddress(formulaAddress)

      if (sourceRange.addressInRange(absoluteDependencyAddress)) {
        return dependencyAddress.shiftAbsoluteDimensions(toRight, toBottom)
      } else if (targetRange.addressInRange(absoluteDependencyAddress)) {
        return ErrorType.REF
      }

      const shiftedAddress = dependencyAddress.shiftRelativeDimensions(-toRight, -toBottom)
      const targetFormulaAddress = simpleCellAddress(formulaAddress.sheet, formulaAddress.col + toRight, formulaAddress.row + toBottom)
      const newAbsoluteDependencyAddress = shiftedAddress.toSimpleCellAddress(targetFormulaAddress)
      if (newAbsoluteDependencyAddress.row < 0 || newAbsoluteDependencyAddress.col < 0) { // If new address is out of bound, return REF
        return ErrorType.REF
      }

      return shiftedAddress
    }
  }

  function fixDependenciesWhenMovingCells(dependencyAddress: CellAddress, formulaAddress: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    /* We don't want to modify formulas in moved range second time */
    /* Formulas that are in moved range have already changed their address so we need to check targetRange */
    const targetRange = sourceRange.shifted(toRight, toBottom)
    if (!targetRange.addressInRange(formulaAddress) && sourceRange.addressInRange(dependencyAddress.toSimpleCellAddress(formulaAddress))) {
      return dependencyAddress.moved(toSheet, toRight, toBottom)
    }
    return false
  }

  export function transformDependentFormulas(ast: Ast, address: SimpleCellAddress, sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number): Ast {
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
