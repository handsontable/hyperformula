import {Ast, AstNodeType} from './Ast'
import {CellAddress} from './CellAddress'

export type RelativeDependency = CellAddress | [CellAddress, CellAddress]

export interface CacheEntry {
  ast: Ast,
  relativeDependencies: RelativeDependency[]
}
const buildCacheEntry = (ast: Ast, relativeDependencies: RelativeDependency[]) => ({ ast, relativeDependencies })

export class Cache {
  private cache: Map<string, CacheEntry> = new Map()

  public set(hash: string, ast: Ast): CacheEntry {
    const astRelativeDependencies: RelativeDependency[] = []
    collectDependencies(ast, astRelativeDependencies)
    const cacheEntry = buildCacheEntry(ast, astRelativeDependencies)
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
}

export const collectDependencies = (ast: Ast, dependenciesSet: RelativeDependency[]) => {
  switch (ast.type) {
    case AstNodeType.NUMBER:
    case AstNodeType.STRING:
    case AstNodeType.ERROR:
      return
    case AstNodeType.CELL_REFERENCE: {
      dependenciesSet.push(ast.reference)
      return
    }
    case AstNodeType.CELL_RANGE: {
      if (ast.start.sheet === ast.end.sheet) {
        dependenciesSet.push([ast.start, ast.end])
      }
      return
    }
    case AstNodeType.MINUS_UNARY_OP: {
      collectDependencies(ast.value, dependenciesSet)
      return
    }
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
      collectDependencies(ast.left, dependenciesSet)
      collectDependencies(ast.right, dependenciesSet)
      return
    case AstNodeType.FUNCTION_CALL:
      if (ast.procedureName !== 'COLUMNS') {
        ast.args.forEach((argAst: Ast) => collectDependencies(argAst, dependenciesSet))
      }
      return
  }
}
