/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {entitlementKeyChecksumOf, LicenseKeyValidityState} from '../../helpers/licenseKeyValidator'
import {HyperFormula} from '../../HyperFormula'
import {detectLicenseKeyFormat} from '../../license/handsontable-license-key-parser/detectFormat'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

const LICENSE_STATUS_MAP = new Map([
  ['gpl-v3', 1],
  [LicenseKeyValidityState.MISSING, 2],
  [LicenseKeyValidityState.INVALID, 3],
  [LicenseKeyValidityState.EXPIRED, 4],
])

export class VersionPlugin extends FunctionPlugin implements FunctionPluginTypecheck<VersionPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
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
        // An entitlement key may end in its closing bracket, whitespace or a line break saved as
        // text, so its status is read from the checksum, not from the end of the string.
        status = detectLicenseKeyFormat(licenseKey) === 'entitlement'
          ? entitlementKeyChecksumOf(licenseKey).slice(-5)
          : licenseKey.slice(-5)
      }

      return `HyperFormula v${HyperFormula.version}, ${status}`
    })
  }
}
