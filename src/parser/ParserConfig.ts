import {ErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  language: TranslationPackage,
  errorMapping: Record<string, ErrorType>,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  functionsWhichDoesNotNeedArgumentsToBeComputed(): Set<string>,
  getErrorTranslationFor(errorType: ErrorType): string,
  getFunctionTranslationFor(functionName: string): string,
  numericStringToNumber: (input: string) => number,
}
