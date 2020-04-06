import {ErrorType} from '../Cell'
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
      throw new Error(`No translation for function ${key}.`)
    } else {
      return val
    }
  }
  public getErrorTranslation(key: ErrorType): string {
    const val = this.errors[key]
    if(val === undefined) {
      throw new Error(`No translation for error ${key}.`)
    } else {
      return val
    }
  }
  public getUITranslation(key: UIElement): string {
    const val = this.ui[key]
    if(val === undefined) {
      throw new Error(`No translation for ui ${key}.`)
    } else {
      return val
    }
  }

  private checkUI(): void {
    for(const iter of Object.values(UIElement)){
      if(! (iter in this.ui)){
        throw new Error(`Translation for ui ${iter} is required.`)
      }
    }
  }
  private checkErrors(): void {
    for(const iter of Object.values(ErrorType)){
      if(! (iter in this.errors)){
        throw new Error(`Translation for error ${iter} is required.`)
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
