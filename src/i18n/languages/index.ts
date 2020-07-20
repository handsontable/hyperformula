/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '../TranslationPackage'
import { default as csCZ } from './csCZ'
import { default as daDK } from './daDK'
import { default as deDE } from './deDE'
import { default as enGB} from './enGB'
import { default as esES } from './esES'
import { default as fiFI } from './fiFI'
import { default as frFR } from './frFR'
import { default as huHU } from './huHU'
import { default as itIT } from './itIT'
import { default as nbNO } from './nbNO'
import { default as nlNL } from './nlNL'
import { default as plPL } from './plPL'
import { default as ptPT } from './ptPT'
import { default as ruRU } from './ruRU'
import { default as svSE } from './svSE'
import { default as trTR } from './trTR'

export {csCZ, daDK, deDE, esES, enGB, fiFI, frFR, huHU, itIT, nbNO, nlNL, plPL, ptPT, ruRU, svSE, trTR, languages}

const languages: Record<string, RawTranslationPackage> = {
  csCZ, daDK, deDE, esES, enGB, fiFI, frFR, huHU, itIT, nbNO, nlNL, plPL, ptPT, ruRU, svSE, trTR,
}
