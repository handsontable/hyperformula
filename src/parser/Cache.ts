import {collectDependencies, RelativeDependency} from './'
import {Ast, AstNodeType} from './Ast'

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
    private readonly volatileFunctions: Set<string>,
    private readonly structuralChangeFunctions: Set<string>,
    private readonly functionsWhichDoesNotNeedArgumentsToBeComputed: Set<string>
  ) {
  }

  public set(hash: string, ast: Ast): CacheEntry {
    const astRelativeDependencies = collectDependencies(ast, this.functionsWhichDoesNotNeedArgumentsToBeComputed)
    const cacheEntry = buildCacheEntry(ast, astRelativeDependencies, doesContainFunctions(ast, this.volatileFunctions), doesContainFunctions(ast, this.structuralChangeFunctions))
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

export const doesContainFunctions = (ast: Ast, interestingFunctions: Set<string>): boolean => {
  switch (ast.type) {
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
    case AstNodeType.CELL_REFERENCE:
    case AstNodeType.CELL_RANGE:
      return false
    case AstNodeType.PERCENT_OP:
    case AstNodeType.PLUS_UNARY_OP:
    case AstNodeType.MINUS_UNARY_OP: {
      return doesContainFunctions(ast.value, interestingFunctions)
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
      return doesContainFunctions(ast.left, interestingFunctions) || doesContainFunctions(ast.right, interestingFunctions)
    case AstNodeType.PARENTHESIS:
      return doesContainFunctions(ast.expression, interestingFunctions)
    case AstNodeType.FUNCTION_CALL: {
      if (interestingFunctions.has(ast.procedureName)) {
        return true
      }
      return ast.args.some((arg) => doesContainFunctions(arg, interestingFunctions))
    }
  }
}
