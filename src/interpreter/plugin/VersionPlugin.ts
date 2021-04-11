/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {LicenseKeyValidityState} from '../../helpers/licenseKeyValidator'
import {HyperFormula} from '../../HyperFormula'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

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
      parameters: [],
    },
  }

  public version(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VERSION'), () => {
      const {
        licenseKeyValidityState: validityState,
        licenseKey,
      } = this.config
      let status

      if (LICENSE_STATUS_MAP.has(licenseKey)) {
        status = LICENSE_STATUS_MAP.get(licenseKey)
      } else if (LICENSE_STATUS_MAP.has(validityState)) {
        status = LICENSE_STATUS_MAP.get(validityState)
      } else if (validityState === LicenseKeyValidityState.VALID) {
        status = licenseKey.slice(-5)
      }

      return `HyperFormula v${HyperFormula.version}, ${status}`
    })
  }
}
