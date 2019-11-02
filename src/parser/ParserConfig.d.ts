import {TranslationPackage} from "../i18n";

export interface ParserConfig {
  functionArgSeparator: string,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  language: TranslationPackage
}
