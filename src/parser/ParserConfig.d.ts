import {TranslationPackage} from "../i18n";
import {ErrorType} from "../Cell";

export interface ParserConfig {
  functionArgSeparator: string,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  getErrorTranslationFor(errorType: ErrorType): string
  getFunctionTranslationFor(functionName: string): string
  language: TranslationPackage
}
