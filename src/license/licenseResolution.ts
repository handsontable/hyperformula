/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  checkLicenseKeyValidity,
  LicenseKeyValidityState,
  notifyLicenseKeyState,
} from '../helpers/licenseKeyValidator'
import {CAPABILITY_TABLE, CORE_TOKEN} from './capabilities'
import {LicenseEntitlement, LicenseExpiry, unrestrictedEntitlement} from './LicenseEntitlement'
import {HYPERFORMULA_PRODUCT_NAME} from './vendor/defaultSchema'
import {extractTypedKeyData, TypedKeyData, TypedKeyProductGrant} from './vendor/extractKeyData'

/** Milliseconds in a day, used to turn the payload's grace period into a deadline. */
const MILLISECONDS_PER_DAY = 86400000

/**
 * Both halves of the license decision, resolved from one reading of the key.
 *
 * They are deliberately produced together: the two gates ask different questions of the same
 * string, and parsing it twice would let them disagree about what it says.
 */
export interface ResolvedLicense {
  /** Gate A — may this instance evaluate formulas at all. */
  validityState: LicenseKeyValidityState,
  /** Gate B — which functions and API features the key grants. */
  entitlement: LicenseEntitlement,
}

/**
 * The build's release date as epoch milliseconds (UTC midnight), or `null` when it is unknown or
 * malformed.
 *
 * Read from the same `HT_RELEASE_DATE` (`DD/MM/YYYY`) the legacy validator uses, so a perpetual
 * typed key and a legacy key agree on what "this build" means.
 */
function releaseDateTimestamp(): number | null {
  const [day, month, year] = (process.env.HT_RELEASE_DATE ?? '').split('/')
  const timestamp = Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))

  return isNaN(timestamp) ? null : timestamp
}

/**
 * The grace period of the licensed product, in days; `0` when the payload does not carry one or
 * carries something that is not a non-negative integer.
 *
 * Read from the LICENSED product rather than from HyperFormula's own entry, because that is the
 * only entry allowed to carry `exp` and `grace` — for a key granting both products, both live on
 * the Handsontable entry.
 *
 * @param {TypedKeyData} data - the extracted key data
 */
function graceDaysOf(data: TypedKeyData): number {
  const {grace} = data.payload.products[data.licensedProductName]

  return typeof grace === 'number' && isFinite(grace) && grace >= 0 ? Math.floor(grace) : 0
}

/**
 * Whether an intact typed key is still valid, and if not, the day it stopped being valid.
 *
 * The comparison depends on the key type, per the format's own rules:
 * - `freemium` never expires;
 * - `trial` and `subscription` have a hard stop: they keep working for `grace` days past the
 *   expiration date, compared against the current time;
 * - `perpetual` has no grace period, and its maintenance end date is compared against the
 *   build's release date rather than the clock, so an air-gapped install with a wrong system
 *   clock is not affected.
 *
 * An unknown release date resolves to "not expired", matching what the legacy validator already
 * does when `HT_RELEASE_DATE` is missing: a build that cannot tell its own age must not start
 * rejecting keys that customers paid for.
 *
 * @param {TypedKeyData} data - the extracted key data
 */
function typedKeyValidity(data: TypedKeyData): {state: LicenseKeyValidityState, expiredOn?: Date} {
  if (data.expiryTimestamp === null) {
    return {state: LicenseKeyValidityState.VALID}
  }

  const isPerpetual = data.keyType === 'perpetual'
  const now = isPerpetual ? releaseDateTimestamp() : Date.now()

  if (now === null) {
    return {state: LicenseKeyValidityState.VALID}
  }

  // The expiration date is INCLUSIVE of its last valid day, and a hard stop extends it by the
  // grace period; a perpetual key has no grace period.
  const deadline = data.expiryTimestamp + MILLISECONDS_PER_DAY
    + (isPerpetual ? 0 : graceDaysOf(data) * MILLISECONDS_PER_DAY)

  return now < deadline
    ? {state: LicenseKeyValidityState.VALID}
    : {state: LicenseKeyValidityState.EXPIRED, expiredOn: new Date(data.expiryTimestamp)}
}

/**
 * The expiry descriptor of an entitlement built from an intact typed key.
 *
 * `noticeDays` is `0` because the typed key format carries no notice period — there is no
 * `notice` field in the payload, and inventing a default here would put a product decision in
 * the parser. If pre-expiry warnings are wanted, the number belongs in the payload schema (which
 * marketing owns) or in an explicit HyperFormula constant, not in this function.
 *
 * @param {TypedKeyData} data - the extracted key data
 */
function expiryOf(data: TypedKeyData): LicenseExpiry {
  if (data.expiryTimestamp === null) {
    return {kind: 'none', date: null, noticeDays: 0, graceDays: 0}
  }

  return {
    kind: data.keyType === 'perpetual' ? 'release' : 'usage',
    // `expiryTimestamp` is UTC midnight by construction, so this round-trips the payload's own
    // `YYYY-MM-DD` exactly.
    date: new Date(data.expiryTimestamp).toISOString().slice(0, 10),
    noticeDays: 0,
    graceDays: data.keyType === 'perpetual' ? 0 : graceDaysOf(data),
  }
}

/**
 * The capability tokens HyperFormula's own entry of the payload grants: its tier plus its
 * add-ons, both of which are only honoured when they are non-empty strings.
 *
 * {@link CORE_TOKEN} is always included. Without it a key whose tier this version does not
 * recognize would block every built-in function, and HF-307 decision D3 says such a key falls
 * back to core and protected functions — not to nothing.
 *
 * @param {TypedKeyProductGrant | undefined} grant - HyperFormula's entry, absent for a key that
 * licenses another product only
 */
function capabilityTokensOf(grant: TypedKeyProductGrant | undefined): string[] {
  const tokens = [CORE_TOKEN]

  if (grant === undefined) {
    return tokens
  }
  if (typeof grant.tier === 'string' && grant.tier.length > 0) {
    tokens.push(grant.tier)
  }
  if (Array.isArray(grant.addons)) {
    grant.addons.forEach((addon) => {
      if (typeof addon === 'string' && addon.length > 0) {
        tokens.push(addon)
      }
    })
  }

  return tokens
}

/**
 * Turns an intact typed key into the entitlement it grants.
 *
 * Per HF-307 decision D3 this is fail-closed and silent: a token this version does not recognize
 * is recorded in `unrecognizedCapabilities` and grants nothing, without a warning, a message, or
 * anything public to read it back from.
 *
 * @param {TypedKeyData} data - the extracted key data
 */
function entitlementFromTypedKey(data: TypedKeyData): LicenseEntitlement {
  const tokens = capabilityTokensOf(data.payload.products[HYPERFORMULA_PRODUCT_NAME])
  const unrecognizedCapabilities = tokens.filter((token) => !CAPABILITY_TABLE.has(token))

  return {
    unrestricted: false,
    capabilities: new Set(tokens),
    unrecognizedCapabilities,
    expiry: expiryOf(data),
    silent: unrecognizedCapabilities.length > 0,
    isTrial: data.keyType === 'trial',
  }
}

/**
 * Resolves a license key into both gates' inputs.
 *
 * A typed key is recognized first; anything else — `gpl-v3`, a legacy key, an empty string, or
 * a malformed typed key — falls through to {@link checkLicenseKeyValidity} completely unchanged,
 * which is what keeps this from touching existing behaviour.
 *
 * **The invariant this function exists to protect.** Only a VALID typed key resolves to a
 * restricted entitlement. Every other outcome — missing, invalid, or expired, for a typed key as
 * much as for a legacy one — resolves to {@link unrestrictedEntitlement}. That asymmetry is
 * deliberate and load-bearing: gate A already stops formula evaluation on its own (a bad key
 * yields `#LIC!` in cells), while gate B additionally makes PR 2's `ensureCapability` throw from
 * the CRUD API. Letting a bad key restrict the entitlement would turn today's "formulas fail,
 * the API still works" into "the API throws", which is a silent breaking change for every
 * existing user whose key lapsed. D3's fail-closed rule governs unrecognized tokens INSIDE an
 * otherwise valid key; it is not a rule about invalid keys, and conflating the two is exactly
 * the mistake this comment is here to prevent.
 *
 * @param {string} licenseKey - the raw `licenseKey` config value
 */
export function resolveLicense(licenseKey: string): ResolvedLicense {
  const typedKeyData = extractTypedKeyData(licenseKey)

  if (typedKeyData === null) {
    return {
      validityState: checkLicenseKeyValidity(licenseKey),
      entitlement: unrestrictedEntitlement(),
    }
  }

  const {state, expiredOn} = typedKeyValidity(typedKeyData)

  notifyLicenseKeyState(state, expiredOn)

  return {
    validityState: state,
    entitlement: state === LicenseKeyValidityState.VALID
      ? entitlementFromTypedKey(typedKeyData)
      : unrestrictedEntitlement(),
  }
}
