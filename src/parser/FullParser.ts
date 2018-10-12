import { Ast } from "./Ast";
import {parseFormula} from "./FormulaParser";
import {IToken} from "chevrotain"

export class FullParser {
  parse(text: string): Ast {
    return parseFormula(text)
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

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}
