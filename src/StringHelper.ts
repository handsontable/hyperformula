/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Config} from './Config'

export function collatorFromConfig(config: Config): Intl.Collator {
  const sensitivity = config.caseSensitive ? (config.accentSensitive ? 'variant' : 'case') : (config.accentSensitive ? 'accent' : 'base')
  const caseFirst = config.caseFirst
  const ignorePunctuation = config.ignorePunctuation
  return new Intl.Collator(config.localeLang, {sensitivity, caseFirst, ignorePunctuation})
}
