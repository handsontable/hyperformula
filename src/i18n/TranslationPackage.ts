import {ErrorType} from '../Cell'
import {Maybe} from '../Maybe'
import {enGB, ErrorTranslationSet, TranslationSet} from './index'

export interface RawTranslationPackage {
  functions: TranslationSet,
  errors: ErrorTranslationSet,
  ui: TranslationSet,
}

export class TranslationPackage implements RawTranslationPackage {
  constructor(
    public functions: TranslationSet,
    public errors: ErrorTranslationSet,
    public ui: TranslationSet,
  ) {
    Object.assign(this.functions, functions)
    Object.assign(this.errors, errors)
    Object.assign(this.ui, ui)
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

  public getFunctionsElement(key: string): Maybe<string> {
    return this.functions[key]
  }
  public getErrorsElement(key: ErrorType): Maybe<string> {
    return this.errors[key]
  }
  public getUIElement(key: string): Maybe<string> {
    return this.ui[key]
  }
}

export function buildTranslationPackage(rawTranslationPackage: RawTranslationPackage): TranslationPackage {
  return new TranslationPackage(
    Object.assign({}, enGB.functions, rawTranslationPackage.functions),
    Object.assign({}, enGB.errors, rawTranslationPackage.errors),
    Object.assign({}, enGB.ui, rawTranslationPackage.ui)
  )
}
