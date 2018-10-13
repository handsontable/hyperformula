import {parseFormula, parseFromTokens, tokenizeFormula} from "./FormulaParser";
import {IToken} from "chevrotain"
import {Ast, TemplateAst} from "./Ast";

export class ParserWithCaching {
  private cache: Map<string, TemplateAst> = new Map()
  public statsCacheUsed: number = 0
  private optimizationMode: string

  constructor(optimizationMode = 'parser') {
    this.optimizationMode = optimizationMode
  }

  parse(text: string): Ast {
    if (this.optimizationMode === 'lexer') {
      const {hash, addresses} = computeHashAndExtractAddressesFromLexer(text);
      const cachedAst = this.cache.get(hash)
      if (cachedAst) {
        this.statsCacheUsed++
        return {
          ast: cachedAst,
          addresses,
        }
      } else {
        const ast = parseFormula(text)
        this.cache.set(hash, ast)
        return { ast: ast, addresses }
      }
    } else {
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
        this.cache.set(hash, ast)
        return { ast: ast, addresses }
      }
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHashAndExtractAddresses = (tokens: IToken[]): { addresses: Array<string>, hash: string } => {
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

export const stringRegex = /^[^']*'/
export const cellRegex = /^[A-Za-z]+[0-9]+/
export const computeHashAndExtractAddressesFromLexer = (code: string): { addresses: Array<string>, hash: string } => {
  const addresses = []
  let hash = ""

  let x = 0
  while (x < code.length) {
    if (code[x] === "'") {
      hash = hash.concat(code[x])
      x++

      do {
        const subcode = code.slice(x)
        const results = subcode.match(stringRegex)
        if (results) {
          hash = hash.concat(results[0])
          x += results[0].length
        } else {
          throw Error('Unexpected parse error')
        }
      } while(code[x - 2] === "\\")
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
