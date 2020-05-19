/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AstNodeType, collectDependencies, RelativeDependency} from './'
import {Ast} from './Ast'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'

export interface CacheEntry {
  ast: Ast,
  relativeDependencies: RelativeDependency[],
  hasVolatileFunction: boolean,
  hasStructuralChangeFunction: boolean,
}
const buildCacheEntry = (ast: Ast, relativeDependencies: RelativeDependency[], hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean) => ({ ast, relativeDependencies, hasVolatileFunction, hasStructuralChangeFunction })

export class Cache {
  private cache: Map<string, CacheEntry> = new Map()

  constructor(
    private readonly functionRegistry: FunctionRegistry,
  ) {
  }

  public set(hash: string, ast: Ast): CacheEntry {
    const astRelativeDependencies = collectDependencies(ast, this.functionRegistry)
    const cacheEntry = buildCacheEntry(ast, astRelativeDependencies, doesContainFunctions(ast, this.functionRegistry.isFunctionVolatile), doesContainFunctions(ast, this.functionRegistry.isFunctionDependentOnSheetStructureChange))
    this.cache.set(hash, cacheEntry)
    return cacheEntry
  }

  public get(hash: string): CacheEntry | null {
    return this.cache.get(hash) || null
  }

  public maybeSetAndThenGet(hash: string, ast: Ast): Ast {
    const entryFromCache = this.cache.get(hash)
    if (entryFromCache) {
      return entryFromCache.ast
    } else {
      this.set(hash, ast)
      return ast
    }
  }

  public destroy() {
    this.cache.clear()
  }
}

export const doesContainFunctions = (ast: Ast, functionCriterion: (functionId: string) => boolean): boolean => {
  switch (ast.type) {
    case AstNodeType.EMPTY:
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
    case AstNodeType.ERROR_WITH_RAW_INPUT:
    case AstNodeType.CELL_REFERENCE:
    case AstNodeType.CELL_RANGE:
    case AstNodeType.COLUMN_RANGE:
    case AstNodeType.ROW_RANGE:
    case AstNodeType.NAMED_EXPRESSION:
      return false
    case AstNodeType.PERCENT_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.MINUS_UNARY_OP: {
      return doesContainFunctions(ast.value, functionCriterion)
    }
    case AstNodeType.CONCATENATE_OP:
    case AstNodeType.EQUALS_OP:
    case AstNodeType.NOT_EQUAL_OP:
    case AstNodeType.LESS_THAN_OP:
    case AstNodeType.GREATER_THAN_OP:
    case AstNodeType.LESS_THAN_OR_EQUAL_OP:
    case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
    case AstNodeType.MINUS_OP:
    case AstNodeType.PLUS_OP:
    case AstNodeType.TIMES_OP:
    case AstNodeType.DIV_OP:
    case AstNodeType.POWER_OP:
      return doesContainFunctions(ast.left, functionCriterion) || doesContainFunctions(ast.right, functionCriterion)
    case AstNodeType.PARENTHESIS:
      return doesContainFunctions(ast.expression, functionCriterion)
    case AstNodeType.FUNCTION_CALL: {
      if (functionCriterion(ast.procedureName)) {
        return true
      }
      return ast.args.some((arg) =>
        doesContainFunctions(arg, functionCriterion)
      )
    }
  }
}

