export type TranslationSet = Record<string, string>
export {plPL} from './plPL'
export {enGB} from './enGB'

export interface TranslationPackage {
  functions: TranslationSet,
}

export const extendFunctions = (pkg: TranslationPackage, additionalFunctionTranslations: TranslationSet): TranslationPackage => {
  return {
    functions: Object.assign({}, pkg.functions, additionalFunctionTranslations),
  }
}
