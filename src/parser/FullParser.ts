import { Ast } from "./Ast";
import {parseFormula} from "./FormulaParser";

export class FullParser {
  parse(text: string): Ast {
    return parseFormula(text)
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}
