/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from '../Cell'
import {Maybe} from '../Maybe'
import {MissingTranslationError, ProtectedFunctionTranslationError} from '../errors'
import {ErrorTranslationSet, TranslationSet, UIElement, UITranslationSet} from './index'

export interface RawTranslationPackage {
  functions: TranslationSet,
  errors: ErrorTranslationSet,
  ui: UITranslationSet,
}

export class TranslationPackage {
  private readonly _protectedTranslations: TranslationSet = {
    'VERSION': 'VERSION'
  }

  constructor(
    private functions: TranslationSet,
    private errors: ErrorTranslationSet,
    private ui: UITranslationSet,
  ) {
    this.checkUI()
    this.checkErrors()
    this.checkFunctionTranslations(this.functions)
    Object.assign(this.functions, this._protectedTranslations)
  }

  public extendFunctions(additionalFunctionTranslations: TranslationSet): void {
    this.checkFunctionTranslations(additionalFunctionTranslations)
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

  public getFunctionTranslations(functionIds: string[]): string[] {
    const translations: string[] = []
    for (const functionId of functionIds) {
      if (this.isFunctionTranslated(functionId)) {
        translations.push(this.functions[functionId])
      }
    }
    return translations
  }

  public getFunctionTranslation(key: string): string {
    const val = this.functions[key]
    if (val === undefined) {
      throw new MissingTranslationError(`functions.${key}`)
    } else {
      return val
    }
  }

  public getMaybeFunctionTranslation(key: string): Maybe<string> {
    return this.functions[key]
  }

  public getErrorTranslation(key: ErrorType): string {
    const val = this.errors[key]
    if (val === undefined) {
      throw new MissingTranslationError(`errors.${key}`)
    } else {
      return val
    }
  }

  public getUITranslation(key: UIElement): string {
    const val = this.ui[key]
    if (val === undefined) {
      throw new MissingTranslationError(`ui.${key}`)
    } else {
      return val
    }
  }

  private checkUI(): void {
    for (const key of Object.values(UIElement)) {
      if (!(key in this.ui)) {
        throw new MissingTranslationError(`ui.${key}`)
      }
    }
  }

  private checkErrors(): void {
    for (const key of Object.values(ErrorType)) {
      if (!(key in this.errors)) {
        throw new MissingTranslationError(`errors.${key}`)
      }
    }
  }

  private checkFunctionTranslations(functions: TranslationSet) {
    const functionNames = new Set(Object.getOwnPropertyNames(functions))
    for (const protectedTranslation of Object.getOwnPropertyNames(this._protectedTranslations)) {
      if (functionNames.has(protectedTranslation)) {
        throw new ProtectedFunctionTranslationError(protectedTranslation)
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
