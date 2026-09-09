/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {Maybe} from '../Maybe'
import {AstNodeType, collectDependencies, RelativeDependency} from './'
import {Ast} from './Ast'

export interface CacheEntry {
  ast: Ast,
  relativeDependencies: RelativeDependency[],
  hasVolatileFunction: boolean,
  hasStructuralChangeFunction: boolean,
}

const buildCacheEntry = (ast: Ast, relativeDependencies: RelativeDependency[], hasVolatileFunction: boolean, hasStructuralChangeFunction: boolean) => ({
  ast,
  relativeDependencies,
  hasVolatileFunction,
  hasStructuralChangeFunction
})

/** Links cached results in access order so eviction does not scan the cache. */
interface CacheNode {
  hash: string,
  entry: CacheEntry,
  previous?: CacheNode,
  next?: CacheNode,
}

/**
 * A bounded LRU cache; callers must retain ASTs they need independently of it.
 * A doubly linked list adds two references per entry so promotion and eviction
 * update a fixed number of links without scanning the cache.
 */
export class Cache {
  private cache: Map<string, CacheNode> = new Map()
  private oldest?: CacheNode
  private newest?: CacheNode

  constructor(
    private readonly functionRegistry: FunctionRegistry,
    private readonly maxSize: number,
  ) {
  }

  /** Builds parsing metadata and caches it, evicting the least recently used entry. */
  public set(hash: string, ast: Ast): CacheEntry {
    const astRelativeDependencies = collectDependencies(ast, this.functionRegistry)
    const cacheEntry = buildCacheEntry(ast, astRelativeDependencies, doesContainFunctions(ast, this.functionRegistry.isFunctionVolatile), doesContainFunctions(ast, this.functionRegistry.isFunctionDependentOnSheetStructureChange))
    if (this.maxSize === 0) {
      return cacheEntry
    }

    const existing = this.cache.get(hash)
    if (existing !== undefined) {
      existing.entry = cacheEntry
      this.markRecentlyUsed(existing)
      return cacheEntry
    }

    if (this.cache.size === this.maxSize && this.oldest !== undefined) {
      this.cache.delete(this.oldest.hash)
      this.detach(this.oldest)
    }
    const node: CacheNode = {hash, entry: cacheEntry}
    this.cache.set(hash, node)
    this.markRecentlyUsed(node)
    return cacheEntry
  }

  /** Returns an entry and marks it as recently used. */
  public get(hash: string): Maybe<CacheEntry> {
    const node = this.cache.get(hash)
    if (node !== undefined) {
      this.markRecentlyUsed(node)
    }
    return node?.entry
  }

  /** Reuses a cached AST when available, otherwise retains the supplied AST. */
  public maybeSetAndThenGet(hash: string, ast: Ast): Ast {
    return this.get(hash)?.ast ?? this.set(hash, ast).ast
  }

  /** Moves a node to the most recently used end in constant time. */
  private markRecentlyUsed(node: CacheNode): void {
    if (node === this.newest) {
      return
    }
    // A new node is not linked yet; existing nodes must first leave their old position.
    if (node === this.oldest || node.previous !== undefined || node.next !== undefined) {
      this.detach(node)
    }
    node.previous = this.newest
    if (this.newest !== undefined) {
      this.newest.next = node
    } else {
      this.oldest = node
    }
    this.newest = node
  }

  /** Removes a linked node, updating both ends when the cache has only one entry. */
  private detach(node: CacheNode): void {
    if (node.previous !== undefined) {
      node.previous.next = node.next
    } else {
      this.oldest = node.next
    }
    if (node.next !== undefined) {
      node.next.previous = node.previous
    } else {
      this.newest = node.previous
    }
    node.previous = undefined
    node.next = undefined
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
    case AstNodeType.ARRAY: {
      return ast.args.some(row => row.some(arg => doesContainFunctions(arg, functionCriterion)))
    }
  }
}
