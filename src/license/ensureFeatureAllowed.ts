/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Config} from '../Config'
import {LicenseCapabilityMissingError} from '../errors'
import {allowsFeature} from './CapabilityRegistry'
import {FeatureId} from './LicenseEntitlement'

/**
 * Throws {@link LicenseCapabilityMissingError} unless the license lets the caller use `feature`.
 *
 * Checks both gates, in the same order the interpreter does for functions:
 * - gate A first: a key whose state blocks evaluation (missing, invalid, or expired past any
 *   grace period) blocks every gated feature, whatever the entitlement says;
 * - then gate B: a valid key must grant `feature`.
 *
 * Shared by the build-time named-expressions check and `HyperFormula.ensureCapability`, so the two
 * cannot disagree about the same key.
 *
 * @param {Config} config - the config whose resolved license is checked
 * @param {FeatureId} feature - the gated feature being called
 */
export function ensureFeatureAllowed(config: Config, feature: FeatureId): void {
  if (config.licenseBlocksEvaluation) {
    throw new LicenseCapabilityMissingError(feature, config.licenseKeyValidityState)
  }
  if (!allowsFeature(config.licenseCapabilities, feature)) {
    throw new LicenseCapabilityMissingError(feature)
  }
}
