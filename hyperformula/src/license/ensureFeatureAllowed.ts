/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from '../Config'
import {LicenseCapabilityMissingError} from '../errors'
import {allowsFeature} from './CapabilityRegistry'
import {FeatureId} from './LicenseEntitlement'

/**
 * Whether the license lets the caller use `feature`. Checks both gates, in the same order the
 * interpreter does for functions:
 * - gate A first: a key whose state blocks evaluation (a missing or invalid key, an expired classic
 *   key, or a trial past its grace period) blocks every gated feature, whatever the entitlement says;
 * - then gate B: a key that evaluates must grant `feature`.
 *
 * The one rule behind {@link ensureFeatureAllowed}, the `isItPossibleTo*` predicates and
 * `isThereSomethingToUndo`/`isThereSomethingToRedo`, so a predicate never answers `true` for a call
 * that then throws a license error.
 *
 * @param {Config} config - the config whose resolved license is checked
 * @param {FeatureId} feature - the gated feature being asked about
 */
export function isFeatureAllowed(config: Config, feature: FeatureId): boolean {
  return !config.licenseBlocksEvaluation && allowsFeature(config.licenseCapabilities, feature)
}

/**
 * Throws {@link LicenseCapabilityMissingError} unless {@link isFeatureAllowed}. When the key itself
 * blocks evaluation, the error names the key's state.
 *
 * Shared by the build-time named-expressions check and `HyperFormula.ensureCapability`, so the two
 * cannot disagree about the same key.
 *
 * @param {Config} config - the config whose resolved license is checked
 * @param {FeatureId} feature - the gated feature being called
 */
export function ensureFeatureAllowed(config: Config, feature: FeatureId): void {
  if (isFeatureAllowed(config, feature)) {
    return
  }
  throw new LicenseCapabilityMissingError(feature, config.licenseBlocksEvaluation ? config.licenseKeyValidityState : undefined)
}
