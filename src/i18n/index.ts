import {ErrorType} from '../Cell'

export type TranslationSet = Record<string, string>
export type ErrorTranslationSet = Record<ErrorType, string>
export {plPL} from './plPL'
export {enGB} from './enGB'
import {enGB} from './enGB'
import {plPL} from './plPL'

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


}

export const extendFunctions = (pkg: RawTranslationPackage, additionalFunctionTranslations: TranslationSet): RawTranslationPackage => {
  return {
    functions: Object.assign({}, pkg.functions, additionalFunctionTranslations),
    errors: pkg.errors,
    ui: pkg.ui,
  }
}

export const languages: Record<string, RawTranslationPackage> = {
  plPL,
  enGB,
}
