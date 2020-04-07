/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from '../Cell'
import {MissingTranslationError} from '../errors'
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
      throw new MissingTranslationError(`functions.${key}`)
    } else {
      return val
    }
  }
  public getErrorTranslation(key: ErrorType): string {
    const val = this.errors[key]
    if(val === undefined) {
      throw new MissingTranslationError(`errors.${key}`)
    } else {
      return val
    }
  }
  public getUITranslation(key: UIElement): string {
    const val = this.ui[key]
    if(val === undefined) {
      throw new MissingTranslationError(`ui.${key}`)
    } else {
      return val
    }
  }

  private checkUI(): void {
    for(const key of Object.values(UIElement)){
      if(! (key in this.ui)){
        throw new MissingTranslationError(`ui.${key}`)
      }
    }
  }
  private checkErrors(): void {
    for(const key of Object.values(ErrorType)){
      if(! (key in this.errors)){
        throw new MissingTranslationError(`errors.${key}`)
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
