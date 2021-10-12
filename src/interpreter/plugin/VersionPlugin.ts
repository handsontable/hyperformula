/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {LicenseKeyValidityState} from '../../helpers/licenseKeyValidator'
import {HyperFormula} from '../../HyperFormula'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

const LICENSE_STATUS_MAP = new Map([
  ['gpl-v3', 1],
  [LicenseKeyValidityState.MISSING, 2],
  [LicenseKeyValidityState.INVALID, 3],
  [LicenseKeyValidityState.EXPIRED, 4],
])

export class VersionPlugin extends FunctionPlugin implements FunctionPluginTypecheck<VersionPlugin> {
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
