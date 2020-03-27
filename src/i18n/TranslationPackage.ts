import {ErrorType} from '../Cell'
import {ErrorTranslationSet, TranslationSet} from './index'

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
}

export function buildTranslationPackage(rawTranslationPackage: RawTranslationPackage): TranslationPackage {
  return new TranslationPackage(rawTranslationPackage.functions, rawTranslationPackage.errors, rawTranslationPackage.ui)
}
