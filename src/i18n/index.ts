/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from '../Cell'
import {enGB} from './languages/enGB'
import {plPL} from './languages/plPL'
import {buildTranslationPackage, RawTranslationPackage, TranslationPackage} from './TranslationPackage'

export type TranslationSet = Record<string, string>
export type UITranslationSet = Record<UIElement, string>
export type ErrorTranslationSet = Record<ErrorType, string>
export {plPL} from './languages/plPL'
export {enGB} from './languages/enGB'
export {RawTranslationPackage, TranslationPackage, buildTranslationPackage}

export enum UIElement {
  NEW_SHEET_PREFIX = 'NEW_SHEET_PREFIX'
}

export const languages: Record<string, RawTranslationPackage> = {
  plPL,
  enGB,
}
