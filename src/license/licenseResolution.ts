/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  checkLicenseKeyValidity,
  LicenseKeyValidityState,
  notifyEntitlementKey,
} from '../helpers/licenseKeyValidator'
import {CAPABILITY_TABLE, normalizeCapabilityToken} from './capabilities'
import {LicenseEntitlement, LicenseExpiry, unrestrictedEntitlement} from './LicenseEntitlement'
import {detectLicenseKeyFormat} from './handsontable-license-key-parser/detectFormat'
import {readEntitlementLicense} from './handsontable-license-key-parser/readLicense'
import {toIsoBuildDate} from './handsontable-license-key-parser/buildDate'
import {LicenseState, ProductEntitlement} from './handsontable-license-key-parser/types'

/**
 * The name of HyperFormula's own product entry in an entitlement key payload. A key that grants
 * other products but not this one is not a license for HyperFormula (the reader returns
 * `product_missing`), however many other products it grants.
 */
export const HYPERFORMULA_PRODUCT_NAME = 'hyperformula'

/**
 * Lifecycle states in which an entitlement key still lets this build evaluate formulas.
 *
 * The soft-stop states are here on purpose: the grace period keeps evaluating and prints the
 * specification's error (see `notifyEntitlementKey`). What happens after the grace period is
 * {@link EXPIRED_WITHOUT_BLOCKING_STATES}.
 */
const VALID_STATES: LicenseState[] = [
  'usage_valid', 'usage_notice', 'usage_soft_stop',
  'trial_valid', 'trial_notice', 'trial_soft_stop',
  'release_valid',
]

/**
 * Lifecycle states in which a non-trial key has run out but still lets this build evaluate
 * formulas, printing an error to the console instead. Decided on #1728 (2026-10-01): "Don't block.
 * It should just print an error in console." This matches the reader's guide (18.1 never blocks a
 * paying customer) and rev 5 §4.1. A trial hard stop still blocks.
 *
 * The key keeps its own grants: the reader reports it as licensed, so an expired key is never
 * granted more than the same key was granted while it was current.
 */
const EXPIRED_WITHOUT_BLOCKING_STATES: LicenseState[] = ['usage_hard_stop', 'release_expired']

/**
 * Both halves of the license decision, resolved from one reading of the key.
 *
 * They are deliberately produced together: the two gates ask different questions of the same
 * string, and parsing it twice would let them disagree about what it says.
 */
export interface ResolvedLicense {
  /** The key's state, as reported by `VERSION()` and the console messages. */
  validityState: LicenseKeyValidityState,
  /**
   * Gate A — `true` when function calls must return `#LIC!`. Usually `validityState !== VALID`;
   * the exception is an expired non-trial entitlement key, which reports `EXPIRED` but keeps
   * evaluating (see {@link EXPIRED_WITHOUT_BLOCKING_STATES}).
   */
  blocksEvaluation: boolean,
  /** Gate B — which functions and API features the key grants. */
  entitlement: LicenseEntitlement,
}

/**
 * The expiry details an entitlement records, read off HyperFormula's own entry.
 *
 * A `release_until` date has no grace period: it is compared with the build date, which never
 * moves, so there is no window to be inside of.
 *
 * @param {ProductEntitlement} entry - HyperFormula's entry of an intact key
 */
function expiryOf(entry: ProductEntitlement): LicenseExpiry {
  const comparedAgainstReleaseDate = entry.release_until !== undefined

  return {
    kind: comparedAgainstReleaseDate ? 'release' : 'usage',
    date: (comparedAgainstReleaseDate ? entry.release_until : entry.usage_until) as string,
    noticeDays: entry.notice,
    graceDays: comparedAgainstReleaseDate ? 0 : entry.grace,
  }
}

/**
 * Turns HyperFormula's entry of a valid entitlement key into the entitlement it grants.
 *
 * Per HF-307 decision D3 this is fail-closed and silent: a token this version does not recognize
 * is recorded in `unrecognizedCapabilities` and grants nothing, without a warning, a message, or
 * anything public to read it back from. "Silent" there means the *grant* is silent — whether the
 * key's console messages are suppressed is decided solely by its `no-console-warns` flag, never
 * by the presence of an unrecognized token; coupling the two suppressed expiry notices as a side
 * effect of a vocabulary mismatch, and was confirmed an implementation error.
 *
 * @param {ProductEntitlement} entry - HyperFormula's entry of a valid key
 * @param {boolean} isTrial - whether the key carries the `trial` flag
 * @param {boolean} silent - whether the key closes the console channel
 */
function entitlementOf(entry: ProductEntitlement, isTrial: boolean, silent: boolean): LicenseEntitlement {
  // Appended one by one rather than with `push(...entry.capabilities)`. The array comes from an
  // attacker-influenced payload and the format sets no size limit, and spreading an array into a
  // call puts one argument per stack slot: measured, a checksum-valid key carrying 125 000 tokens
  // threw `RangeError: Maximum call stack size exceeded` out of `HyperFormula.buildFromArray`
  // instead of resolving to a verdict.
  const capabilityTokens: string[] = []
  entry.capabilities.forEach((token) => capabilityTokens.push(token))

  const unrecognizedCapabilities = capabilityTokens.filter(
    (token) => !CAPABILITY_TABLE.has(normalizeCapabilityToken(token)),
  )

  return {
    unrestricted: false,
    capabilities: new Set(capabilityTokens),
    unrecognizedCapabilities,
    expiry: expiryOf(entry),
    silent,
    isTrial,
  }
}

/**
 * Resolves a license key into both gates' inputs.
 *
 * Routing follows the vendored {@link detectLicenseKeyFormat}, whose test order is normative
 * (key spec addendum, T12): the literals, then the trailing bracketed block that marks an
 * entitlement key, then the legacy 25-character shape. Everything that is not an entitlement key
 * — `gpl-v3`, a legacy key, an empty string — falls through to {@link checkLicenseKeyValidity}
 * completely unchanged, which is what keeps this from touching existing behaviour. A string that
 * carries a bracketed block routes here even when the block is garbage: such a key is INVALID,
 * not a legacy key that happens to contain brackets.
 *
 * An entitlement key is read by the vendored {@link readEntitlementLicense}, the single entry
 * point upstream prescribes for products: it verifies the block, picks HyperFormula's entry,
 * places it in its lifecycle window and reads its flags. Only the meaning of the capability
 * tokens and the console messages live here.
 *
 * **The invariant this function exists to protect.** Only a VALID entitlement key resolves to a
 * restricted entitlement. Every other outcome — missing, invalid, or expired, for an entitlement
 * key as much as for a legacy one — resolves to {@link unrestrictedEntitlement}. That asymmetry is
 * deliberate and load-bearing: gate A already stops formula evaluation on its own (a bad key
 * yields `#LIC!` in cells), while gate B additionally makes PR 2's `ensureCapability` throw from
 * the CRUD API. Letting a bad key restrict the entitlement would turn today's "formulas fail,
 * the API still works" into "the API throws", which is a silent breaking change for every
 * existing user whose key lapsed. D3's fail-closed rule governs unrecognized tokens INSIDE an
 * otherwise valid key; it is not a rule about invalid keys, and conflating the two is exactly
 * the mistake this comment is here to prevent.
 *
 * A checksum-valid key whose payload shape cannot be read is INVALID, not a crash and not a free
 * pass: every payload field is untrusted, so nothing here may assume a shape the vendored reader
 * has not verified.
 *
 * @param {string} licenseKey - the raw `licenseKey` config value
 * @param {boolean} notifyConsole - pass `false` for a resolution whose result exists only to be
 * thrown away (e.g. the transient serialization-only `Config` that `rebuildWithConfig` builds
 * from the OUTGOING config) — such a resolution must not print notices for a key the caller is
 * in the middle of replacing. Legacy keys notify inside {@link checkLicenseKeyValidity} behind a
 * once-per-page-load flag, so they cannot double-print regardless of this parameter.
 */
export function resolveLicense(licenseKey: string, notifyConsole: boolean = true): ResolvedLicense {
  if (detectLicenseKeyFormat(licenseKey) !== 'entitlement') {
    const validityState = checkLicenseKeyValidity(licenseKey)

    return {
      validityState,
      blocksEvaluation: validityState !== LicenseKeyValidityState.VALID,
      entitlement: unrestrictedEntitlement(),
    }
  }

  // Read exactly as the bundler inlines it - see the reader's README, rule 4. A missing or
  // malformed `HT_RELEASE_DATE` becomes '', which the reader treats as "build date unknown" and
  // fails open on, as the legacy validator does.
  const license = readEntitlementLicense(licenseKey, {
    product: HYPERFORMULA_PRODUCT_NAME,
    buildDate: toIsoBuildDate(process.env.HT_RELEASE_DATE),
  })

  if (!license.licensed) {
    // `unreadable` (a broken block) and `product_missing` (a key for other products only) are
    // both reported as an invalid key, and neither restricts anything.
    if (notifyConsole) {
      notifyEntitlementKey(licenseKey, 'invalid', {licensedUntil: null, daysRemaining: null})
    }

    return {validityState: LicenseKeyValidityState.INVALID, blocksEvaluation: true, entitlement: unrestrictedEntitlement()}
  }

  const {entitlement: entry, lifecycle, channels} = license
  const expiredWithoutBlocking = EXPIRED_WITHOUT_BLOCKING_STATES.indexOf(lifecycle.state) !== -1
  const isValid = VALID_STATES.indexOf(lifecycle.state) !== -1
  const state = isValid ? LicenseKeyValidityState.VALID : LicenseKeyValidityState.EXPIRED

  // The message is chosen by the reader's state and prints the key's own date (rev 5/6 §4.1, the
  // same table Handsontable uses). The `no-console-warns` flag closes the channel.
  if (notifyConsole && channels.console) {
    notifyEntitlementKey(licenseKey, lifecycle.state, {licensedUntil: lifecycle.licensedUntil, daysRemaining: lifecycle.daysRemaining})
  }

  return {
    validityState: state,
    blocksEvaluation: !isValid && !expiredWithoutBlocking,
    entitlement: isValid || expiredWithoutBlocking
      ? entitlementOf(entry, lifecycle.isTrial, !channels.console)
      : unrestrictedEntitlement(),
  }
}
