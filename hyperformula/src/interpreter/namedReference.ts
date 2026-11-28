/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {DependencyGraph} from '../DependencyGraph'
import {FormulaVertex} from '../DependencyGraph/FormulaVertex'
import {Maybe} from '../Maybe'
import {AstNodeType} from '../parser'

/**
 * Returns the cell, range, or whole columns or rows a named expression refers to, as a range (a single cell is a
 * one-cell range), or undefined if there is no such name in scope or it is not a reference (e.g., =5). Reads the
 * named expression's formula, not its value, so a name for a function that returns a range is not a reference.
 *
 * With `throughParentheses`, a name like `=(Sheet1!$B$5)` refers to B5 too: ROW and COLUMN read it so, while INDIRECT
 * returns `#REF!` for it, as in Excel.
 */
export function namedReference(dependencyGraph: DependencyGraph, name: string, sheet: number, throughParentheses = false): Maybe<AbsoluteCellRange> {
  const namedExpression = dependencyGraph.namedExpressions.nearestNamedExpression(name, sheet)
  if (namedExpression === undefined) {
    return undefined
  }
  const vertex = dependencyGraph.addressMapping.getCell(namedExpression.address)
  if (!(vertex instanceof FormulaVertex)) {
    return undefined
  }
  let ast = vertex.getFormula(dependencyGraph.lazilyTransformingAstService)
  while (throughParentheses && ast.type === AstNodeType.PARENTHESIS) {
    ast = ast.expression
  }
  const baseAddress = vertex.getAddress(dependencyGraph.lazilyTransformingAstService)
  if (ast.type === AstNodeType.CELL_REFERENCE) {
    const address = ast.reference.toSimpleCellAddress(baseAddress)
    return new AbsoluteCellRange(address, address)
  }
  if (ast.type === AstNodeType.CELL_RANGE || ast.type === AstNodeType.COLUMN_RANGE || ast.type === AstNodeType.ROW_RANGE) {
    return AbsoluteCellRange.fromAstOrUndef(ast, baseAddress)
  }
  return undefined
}
