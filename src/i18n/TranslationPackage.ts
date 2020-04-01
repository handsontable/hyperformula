import {ErrorType} from '../Cell'
import {Maybe} from '../Maybe'
import {enGB, ErrorTranslationSet, TranslationSet} from './index'

export interface RawTranslationPackage {
  functions: TranslationSet,
  errors: ErrorTranslationSet,
  ui: TranslationSet,
}

export class TranslationPackage {
  constructor(
    private functions: TranslationSet,
    private errors: ErrorTranslationSet,
    private ui: TranslationSet,
  ) {
  }

  public extendFunctions(additionalFunctionTranslations: TranslationSet): void {
    Object.assign(this.functions, additionalFunctionTranslations)
  }

  public buildFunctionMapping(): Record<string, string> {
    return Object.keys(this.functions).reduce((ret, key) => {
      ret[this.functions[key]] = key
      return ret
    }, {} as Record<string, string>)
  }

  public buildErrorMapping(): Record<string, ErrorType> {
    return Object.keys(this.errors).reduce((ret, key) => {
      ret[this.errors[key as ErrorType]] = key as ErrorType
      return ret
    }, {} as Record<string, ErrorType>)
  }

  public getFunctionTranslation(key: string): Maybe<string> {
    return this.functions[key]
  }
  public getErrorTranslation(key: ErrorType): Maybe<string> {
    return this.errors[key]
  }
  public getUITranslation(key: string): Maybe<string> {
    return this.ui[key]
  }
}

export function buildTranslationPackage(rawTranslationPackage: RawTranslationPackage): TranslationPackage {
  return new TranslationPackage(
    Object.assign({}, rawTranslationPackage.functions),
    Object.assign({}, rawTranslationPackage.errors),
    Object.assign({}, rawTranslationPackage.ui)
  )
}
