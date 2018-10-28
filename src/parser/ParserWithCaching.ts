import {parseFormula, parseFromTokens, RangeSeparator, RelativeCell, tokenizeFormula} from "./FormulaParser";
import {IToken, tokenMatcher} from "chevrotain"
import {Ast, AstNodeType, TemplateAst} from "./Ast";
import {CellAddress, relativeCellAddress} from "../Cell"
import {CellDependency} from "../Cell";

export class ParserWithCaching {
  private cache: Map<string, TemplateAst> = new Map()
  public statsCacheUsed: number = 0
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  parse(text: string): Ast {
    if (this.optimizationMode === 'parser') {
      const lexerResult = tokenizeFormula(text);
      const {hash, addresses} = computeHashAndExtractAddresses(lexerResult.tokens);
      let ast = this.cache.get(hash)

      if (ast) {
        ++this.statsCacheUsed
      } else {
        ast = parseFromTokens(lexerResult)
        this.cache.set(hash, ast)
      }

      return {
        ast: ast,
        addresses: ast.type === AstNodeType.ERROR ? [] : addresses
      }
    } else {
      throw new Error("Unsupported optimization mode")
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHashAndExtractAddresses = (tokens: IToken[]): { addresses: Array<CellDependency>, hash: string } => {
  const addresses: Array<CellDependency> = []
  let hash = ""
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (tokenMatcher(token, RelativeCell)) {
      if (tokens[idx+1] && tokens[idx+2] && tokenMatcher(tokens[idx+1],RangeSeparator) && tokenMatcher(tokens[idx+2], RelativeCell)) {
        addresses.push([cellAddressFromString(token.image), cellAddressFromString(tokens[idx+2].image)])
        hash = hash.concat("#:#")
        idx += 3
      } else {
        addresses.push(cellAddressFromString(token.image))
        hash = hash.concat("#")
        idx++
      }
    } else {
      hash = hash.concat(token.image)
      idx++
    }
  }
  return { addresses, hash }
};

export const cellAddressFromString = (stringAddress: string): CellAddress => {
  const result = stringAddress.match(/([A-Z]+)([0-9]+)/)!
  const col = result[1].split("").reduce((currentColumn, nextLetter) => {
    return currentColumn * 26 + (nextLetter.charCodeAt(0) - 64)
  }, 0) - 1
  const row = Number(result[2] as string) - 1
  return relativeCellAddress(col, row)
}
