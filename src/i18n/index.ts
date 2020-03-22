import {ErrorType} from '../Cell'

export type TranslationSet = Record<string, string>
export type ErrorTranslationSet = Record<ErrorType, string>
export {plPL} from './plPL'
export {enGB} from './enGB'
import {enGB} from './enGB'
import {plPL} from './plPL'

export interface TranslationPackage {
  functions: TranslationSet,
  errors: ErrorTranslationSet,
  interface: TranslationSet,
}

export function getSheetPrefix(translationPackage: TranslationPackage): string {
  const ret = translationPackage?.interface?.NEW_SHEET_PREFIX
  if(ret === undefined) {
    return enGB.interface.NEW_SHEET_PREFIX
  } else {
    return ret
  }
}

export const extendFunctions = (pkg: TranslationPackage, additionalFunctionTranslations: TranslationSet): TranslationPackage => {
  return {
    functions: Object.assign({}, pkg.functions, additionalFunctionTranslations),
    errors: pkg.errors,
    interface: pkg.interface,
  }
}

export const languages: Record<string, TranslationPackage> = {
  plPL,
  enGB,
}
