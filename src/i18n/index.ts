/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {TranslatableErrorType} from '../Cell'
import {buildTranslationPackage, RawTranslationPackage, TranslationPackage} from './TranslationPackage'

export type TranslationSet = Record<string, string>
export type UITranslationSet = Record<UIElement, string>
export type ErrorTranslationSet = Record<TranslatableErrorType, string>
export {RawTranslationPackage, TranslationPackage, buildTranslationPackage}

export enum UIElement {
  NEW_SHEET_PREFIX = 'NEW_SHEET_PREFIX',
}
