import {ErrorType} from '../Cell'

export type TranslationSet = Record<string, string>
export type ErrorTranslationSet = Record<ErrorType, string>
export {plPL} from './plPL'
export {enGB} from './enGB'
import {enGB} from './enGB'
import {plPL} from './plPL'
import {RawTranslationPackage, TranslationPackage, buildTranslationPackage} from './TranslationPackage'
export {RawTranslationPackage, TranslationPackage, buildTranslationPackage}


export const languages: Record<string, RawTranslationPackage> = {
  plPL,
  enGB,
}
