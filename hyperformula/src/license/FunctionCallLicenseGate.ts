/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../Cell'
import {Config} from '../Config'
import {ErrorMessage} from '../error-message'
import {LicenseKeyValidityState} from '../helpers/licenseKeyValidator'
import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {CapabilityRegistry, licenseAllowsFunction, ResolvedCapabilities} from './CapabilityRegistry'

/**
 * Decides whether the license stops a function call, and with which `#LIC!` error.
 *
 * The one rule behind two consumers: the interpreter, which evaluates a stopped call to that
 * error, and the array size predictor, which sizes a stopped call as a single cell. A stopped call
 * therefore reserves no spill range, so its `#LIC!` appears in its own cell only and a non-empty
 * cell below it cannot turn it into `#SPILL!`. Sharing one object keeps the two from disagreeing
 * about the same call.
 *
 * Built from an engine's config, once per consumer. The license decisions are read off the config
 * here rather than through its getters (a WeakMap lookup each), because the interpreter asks on the
 * hottest path of evaluation. They cannot go stale: a Config never changes once built, and
 * `updateConfig` builds a new engine, and with it new consumers.
 */
export class FunctionCallLicenseGate {
  private readonly blocksEvaluation: boolean
  private readonly validityState: LicenseKeyValidityState
  private readonly capabilityRegistry: CapabilityRegistry
  private readonly capabilities: ResolvedCapabilities
  /** `false` for a key that grants every function, which lets a call skip the alias and table lookups. */
  private readonly restrictsFunctions: boolean

  /**
   * @param {Config} config - the engine's config, holding its resolved license
   * @param {FunctionRegistry} functionRegistry - the engine's registry, which resolves aliases
   */
  constructor(config: Config, private readonly functionRegistry: FunctionRegistry) {
    this.blocksEvaluation = config.licenseBlocksEvaluation
    this.validityState = config.licenseKeyValidityState
    this.capabilityRegistry = config.capabilityRegistry
    this.capabilities = config.licenseCapabilities
    this.restrictsFunctions = config.licenseCapabilities.functions !== 'all'
  }

  /**
   * Returns the `#LIC!` error a call to the function evaluates to, or `undefined` when the license
   * lets the call run. The checks run in the specification's order: a protected function always
   * runs; a key that blocks evaluation stops every other call (C1); a key that evaluates stops a
   * call to a function it does not grant (C2), checking an alias as its canonical function.
   *
   * @param {string} procedureName - the function id as written in the formula
   */
  public stoppedCallError(procedureName: string): CellError | undefined {
    if (FunctionRegistry.functionIsProtected(procedureName)) {
      return undefined
    }

    if (this.blocksEvaluation) {
      return new CellError(ErrorType.LIC, ErrorMessage.LicenseKey(this.validityState))
    }

    if (this.restrictsFunctions
      && !licenseAllowsFunction(this.capabilityRegistry, this.capabilities, this.functionRegistry.getCanonicalFunctionId(procedureName))) {
      return new CellError(ErrorType.LIC, ErrorMessage.LicenseCapability(procedureName))
    }

    return undefined
  }

  /**
   * Whether the license stops a call to the function, so that the call evaluates to `#LIC!`.
   *
   * @param {string} procedureName - the function id as written in the formula
   */
  public stopsCall(procedureName: string): boolean {
    return this.stoppedCallError(procedureName) !== undefined
  }
}
