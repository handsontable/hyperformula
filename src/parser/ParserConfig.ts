import {ErrorType} from '../Cell'
import {RawTranslationPackage} from '../i18n'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  translationPackage: RawTranslationPackage,
  errorMapping: Record<string, ErrorType>,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  functionsWhichDoesNotNeedArgumentsToBeComputed(): Set<string>,
  getErrorTranslationFor(errorType: ErrorType): string,
  getFunctionTranslationFor(functionName: string): string,
}
