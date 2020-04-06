import {ErrorType} from '../Cell'
import {Maybe} from '../Maybe'
import {ErrorTranslationSet, TranslationSet, UIElement, UITranslationSet} from './index'

export interface RawTranslationPackage {
  functions: TranslationSet,
  errors: ErrorTranslationSet,
  ui: UITranslationSet,
}

export class TranslationPackage {
  constructor(
    private functions: TranslationSet,
    private errors: ErrorTranslationSet,
    private ui: UITranslationSet,
  ) {
    this.checkUI()
    this.checkErrors()
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

  public isFunctionTranslated(key: string): boolean {
    return this.functions[key] !== undefined
  }

  public getFunctionTranslation(key: string): string {
    const val = this.functions[key]
    if(val === undefined) {
      throw new Error('No translation for function.')
    } else {
      return val
    }
  }
  public getErrorTranslation(key: ErrorType): string {
    const val = this.errors[key]
    if(val === undefined) {
      throw new Error('No translation for error.')
    } else {
      return val
    }
  }
  public getUITranslation(key: UIElement): string {
    const val = this.ui[key]
    if(val === undefined) {
      throw new Error('No translation for ui.')
    } else {
      return val
    }
  }

  private checkUI(): void {
    for(const err of Object.values(UIElement)){
      if(! (err in this.ui)){
        throw new Error('No translation for ui.')
      }
    }
  }
  private checkErrors(): void {
    for(const err of Object.values(ErrorType)){
      if(! (err in this.errors)){
        throw new Error('No translation for error.')
      }
    }
  }
}

export function buildTranslationPackage(rawTranslationPackage: RawTranslationPackage): TranslationPackage {
  return new TranslationPackage(
    Object.assign({}, rawTranslationPackage.functions),
    Object.assign({}, rawTranslationPackage.errors),
    Object.assign({}, rawTranslationPackage.ui)
  )
}
