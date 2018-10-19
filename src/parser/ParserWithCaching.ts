import {parseFormula, parseFromTokens, RangeSeparator, RelativeCell, tokenizeFormula} from "./FormulaParser";
import {IToken} from "chevrotain"
import {Ast, AstNodeType, TemplateAst} from "./Ast";

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
    }
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}

export const computeHashAndExtractAddresses = (tokens: IToken[]): { addresses: Array<string>, hash: string } => {
  const addresses: Array<string> = []
  let hash = ""
  let idx = 0
  while (idx < tokens.length) {
    const token = tokens[idx]
    if (token.tokenType === RelativeCell) {
      if (tokens[idx+1] && tokens[idx+2] && tokens[idx+1].tokenType === RangeSeparator && tokens[idx+2].tokenType === RelativeCell) {
        addresses.push(`${token.image}:${tokens[idx+2].image}`)
        hash = hash.concat("#:#")
        idx += 3
      } else {
        addresses.push(token.image)
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

export const stringRegex = /^[^']*'/
export const cellRegex = /^[A-Za-z]+[0-9]+/
export const cellRangeRegex = /^[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+/
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
      const rangeResults = subcode.match(cellRangeRegex)
      if (rangeResults) {
        addresses.push(rangeResults[0])
        hash = hash.concat("#:#")
        x += rangeResults[0].length
      } else {
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
  }

  return {
    hash,
    addresses
  }
};
