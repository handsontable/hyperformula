import {ErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  language: TranslationPackage
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  getErrorTranslationFor(errorType: ErrorType): string
  getFunctionTranslationFor(functionName: string): string
}
