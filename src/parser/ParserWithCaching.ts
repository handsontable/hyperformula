import {tokenizeFormula, parseFromTokens} from "./FormulaParser";
import {IToken} from "chevrotain"
import {BetterAst, TemplateAst, buildCellReferenceAst, buildPlusOpAst, buildMinusOpAst, buildTimesOpAst, buildDivOpAst, buildNumberAst} from './BetterAst'
import {Ast, AstNodeType} from "./Ast"

export class ParserWithCaching {
  private cache: Map<string, TemplateAst> = new Map()
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

const computeBetterAst = (ast: Ast, idx: number): [TemplateAst, number] => {
  switch (ast.type) {
    case AstNodeType.RELATIVE_CELL: {
      return [buildCellReferenceAst(idx), idx + 1]
    }
    case AstNodeType.PLUS_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        buildPlusOpAst(lhsResult[0], rhsResult[0]),
        rhsResult[1]
      ]
    }
    case AstNodeType.MINUS_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        buildMinusOpAst(lhsResult[0], rhsResult[0]),
        rhsResult[1]
      ]
    }
    case AstNodeType.TIMES_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        buildTimesOpAst(lhsResult[0], rhsResult[0]),
        rhsResult[1]
      ]
    }
    case AstNodeType.DIV_OP: {
      const lhsResult = computeBetterAst(ast.left, idx)
      const rhsResult = computeBetterAst(ast.right, lhsResult[1])
      return [
        buildDivOpAst(lhsResult[0], rhsResult[0]),
        rhsResult[1]
      ]
    }
    case AstNodeType.NUMBER: {
      return [buildNumberAst(ast.value), idx]
    }
  }
}

export const computeHashAndExtractAddressesFromLexer = (code: string) => {
  const cellRegex = /^[A-Za-z]+[0-9]+/
  const addresses = []
  let hash = ""

  let x = 0
  let processingString = false
  while (x < code.length) {
    if (!processingString && code[x] === "'") {
      processingString = true
      hash = hash.concat(code[x])
      x++
      continue
    } else if (processingString) {
      if (code[x] === "'") {
        processingString = false
      }
      hash = hash.concat(code[x])
      x++
      continue
    } else {
      const subcode = code.slice(x)
      const results = subcode.match(cellRegex)
      if (results) {
        addresses.push(results[0])
        hash = hash.concat("#")
        x += results[0].length
      } else {
        hash = hash.concat(code[x])
        x++
      }
    }
  }

  return {
    hash,
    addresses
  }
};
