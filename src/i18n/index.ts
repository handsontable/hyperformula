/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {ErrorType} from '../Cell'
import {enGB} from './enGB'
import {plPL} from './plPL'
import {buildTranslationPackage, RawTranslationPackage, TranslationPackage} from './TranslationPackage'

export type TranslationSet = Record<string, string>
export type UITranslationSet = Record<UIElement, string>
export type ErrorTranslationSet = Record<ErrorType, string>
export {plPL} from './plPL'
export {enGB} from './enGB'
export {RawTranslationPackage, TranslationPackage, buildTranslationPackage}

export enum UIElement {
  NEW_SHEET_PREFIX = 'NEW_SHEET_PREFIX'
}

export const languages: Record<string, RawTranslationPackage> = {
  plPL,
  enGB,
}
