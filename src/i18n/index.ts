export type TranslationSet = Record<string, string>
export {plPL} from './plPL'
export {enGB} from './enGB'
import {enGB} from './enGB'
import {plPL} from './plPL'

export interface TranslationPackage {
  functions: TranslationSet,
  errors: TranslationSet,
  interface: TranslationSet
}

export const extendFunctions = (pkg: TranslationPackage, additionalFunctionTranslations: TranslationSet): TranslationPackage => {
  return {
    functions: Object.assign({}, pkg.functions, additionalFunctionTranslations),
    errors: pkg.errors,
    interface: pkg.interface
  }
}

export const languages: Record<string, TranslationPackage> = {
  plPL,
  enGB,
}
