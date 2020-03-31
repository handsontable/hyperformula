import {ErrorType} from '../Cell'
import {TranslationPackage} from '../i18n'
import {Maybe} from '../Maybe'

export interface ParserConfig {
  functionArgSeparator: string,
  decimalSeparator: '.' | ',',
  translationPackage: TranslationPackage,
  errorMapping: Record<string, ErrorType>,
  volatileFunctions(): Set<string>,
  structuralChangeFunctions(): Set<string>,
  functionsWhichDoesNotNeedArgumentsToBeComputed(): Set<string>,
  getErrorTranslationFor(errorType: ErrorType): string,
  getFunctionTranslationFor(functionName: string): string,
}
