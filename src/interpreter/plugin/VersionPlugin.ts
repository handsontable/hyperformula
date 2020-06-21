/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import { InternalCellValue } from '../../Cell'
import { FunctionPlugin } from './FunctionPlugin'
import { HyperFormula } from '../../HyperFormula'
import { LicenseKeyValidityState } from '../../helpers/licenseKeyValidator'

const LICENSE_STATUS_MAP = new Map([
  ['agpl-v3', 1],
  ['non-commercial-and-evaluation', 2],
  [LicenseKeyValidityState.MISSING, 3],
  [LicenseKeyValidityState.INVALID, 4],
  [LicenseKeyValidityState.EXPIRED, 5],
])

export class VersionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'VERSION': {
      method: 'version',
    },
  }

  public version(): InternalCellValue {
    const {
      licenseKeyValidityState: validityState,
      licenseKey,
    } = this.config
    let status

    if (LICENSE_STATUS_MAP.has(licenseKey)) {
      status = LICENSE_STATUS_MAP.get(licenseKey)

    } else if (LICENSE_STATUS_MAP.has(validityState)) {
      status = LICENSE_STATUS_MAP.get(validityState)

    } else if (!status && validityState === LicenseKeyValidityState.VALID) {
      status = licenseKey.slice(-5)
    }

    return `HyperFormula v${HyperFormula.version}, ${status}`
  }
}
