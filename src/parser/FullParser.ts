import { Ast } from "./Ast";
import {parseFormula} from "../chevro";

export class FullParser {
  parse(text: string): Ast {
    return parseFormula(text)
  }
}

export function isFormula(text: string): Boolean {
  return text.startsWith('=')
}
