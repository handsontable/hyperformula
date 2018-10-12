import {tokenizeFormula, parseFromTokens} from "./FormulaParser";
import {IToken} from "chevrotain"
import {Ast, BetterAst, AstNodeType, buildRelativeCellAst} from './Ast'

export class ParserWithCaching {
  private cache: Map<string, Ast> = new Map()
  public statsCacheUsed: number = 0

  parse(text: string): BetterAst {
    const lexerResult = tokenizeFormula(text);
    const {hash, addresses} = computeHashAndExtractAddresses(lexerResult.tokens);
    const cachedAst = this.cache.get(hash)
    if (cachedAst) {
      this.statsCacheUsed++
      return {
        ast: cachedAst,
        addresses,
      }
    } else {
      const ast = parseFromTokens(lexerResult)
      const [newAst, finalIdx] = computeBetterAst(ast, 0)
      this.cache.set(hash, newAst)
      return { ast: newAst, addresses }
    }
  }
}

export const computeHashAndExtractAddresses = (tokens: IToken[]) => {
  const addresses: Array<string> = []
  const hash = tokens.reduce((currentHash, token) => {
    if (token.tokenType!.tokenName === 'RelativeCell') {
      addresses.push(token.image)
      return currentHash.concat("#")
    } else {
      return currentHash.concat(token.image)
    }
  }, "");
  return { addresses, hash }
};

const computeBetterAst = (ast: Ast, idx: number): [Ast, number] => {
  switch (ast.type) {
    case AstNodeType.RELATIVE_CELL: {
      return [buildRelativeCellAst(idx.toString()), idx + 1]
    }
    case AstNodeType.PLUS_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        { type: ast.type, left: lhsResult[0], right: rhsResult[0] },
        rhsResult[1]
      ]
    }
    case AstNodeType.MINUS_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        { type: ast.type, left: lhsResult[0], right: rhsResult[0] },
        rhsResult[1]
      ]
    }
    case AstNodeType.TIMES_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        { type: ast.type, left: lhsResult[0], right: rhsResult[0] },
        rhsResult[1]
      ]
    }
    case AstNodeType.DIV_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        { type: ast.type, left: lhsResult[0], right: rhsResult[0] },
        rhsResult[1]
      ]
    }
    case AstNodeType.NUMBER: {
      return [ast, idx]
    }
  }
}
