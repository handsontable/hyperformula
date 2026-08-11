/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  checkLicenseKeyValidity,
  LicenseKeyValidityState,
  notifyLicenseKeyState,
} from '../helpers/licenseKeyValidator'
import {
  CAPABILITY_TABLE,
  CORE_TOKEN,
  FUNCTIONS_1_TOKEN,
  FUNCTIONS_2_TOKEN,
  FUNCTIONS_3_TOKEN,
  FUNCTIONS_4_TOKEN,
} from './capabilities'
import {LicenseEntitlement, LicenseExpiry, unrestrictedEntitlement} from './LicenseEntitlement'
import {HYPERFORMULA_PRODUCT_NAME} from './vendor/defaultSchema'
import {extractTypedKeyData, TypedKeyData, TypedKeyProductGrant} from './vendor/extractKeyData'

/** Milliseconds in a day, used to turn a grace period in days into a deadline. */
const MILLISECONDS_PER_DAY = 86400000

/**
 * Below this value a numeric timestamp is read as epoch SECONDS, above it as milliseconds.
 * `1e11` seconds is year 5138, and `1e11` milliseconds is 1973 — no real license date is near
 * either, so the split is unambiguous for anything a key can plausibly carry.
 */
const SECONDS_MILLISECONDS_THRESHOLD = 1e11

/**
 * Commercial tier names (the shipped key format) mapped to the capability tokens the library
 * actually resolves. A tier this map does not know is passed through unchanged, so it surfaces
 * as an unrecognized capability rather than being silently swallowed.
 */
const TIER_TO_CAPABILITY_TOKEN: Record<string, string> = {
  freemium: FUNCTIONS_1_TOKEN,
  crm: FUNCTIONS_2_TOKEN,
  data_grid: FUNCTIONS_3_TOKEN,
  excel_simulator: FUNCTIONS_4_TOKEN,
}

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
 * What HyperFormula needs from a typed key, after the two payload shapes have been reconciled.
 *
 * The engine reads TWO payload shapes on purpose:
 *
 * - the **shipped** shape of `handsontable/license-key` — `tier`, `addons`, `exp`, `grace`, with
 *   the contract type carried by the key's `[TRIAL]`/`[FREE]`/`[SUB]`/`[PERP]` tag;
 * - the shape of key spec **rev 5** — `capabilities`, `usage_until` / `release_until`, `notice`,
 *   `grace`, `flags`, with no commercial vocabulary in the payload at all.
 *
 * The two disagree about nearly every field, rev 5 is still for review, and only the first can
 * be minted today. Reading both means an already-issued key keeps working whichever way that
 * disagreement is settled. Shape is detected per product entry, by the presence of
 * `capabilities`, not guessed from the key type.
 */
interface LicenseTerms {
  capabilityTokens: string[],
  expiry: LicenseExpiry,
  /** Epoch milliseconds of the last licensed day, or `null` when the key never expires. */
  expiryTimestamp: number | null,
  /** `true` compares against the build release date, `false` against the clock. */
  comparedAgainstReleaseDate: boolean,
  graceDays: number,
  isTrial: boolean,
  silent: boolean,
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
 * Reads a date that may arrive either as a `YYYY-MM-DD` string or as a numeric timestamp, and
 * returns it as epoch milliseconds at UTC midnight; `null` when it is neither.
 *
 * Both forms are accepted because key spec rev 5 contradicts itself about them: §1.2 mandates
 * "bare `YYYY-MM-DD` everywhere, no time component", while §2.1 types the same fields as
 * `timestamp` and its example payload carries integers. Accepting both costs a few lines and
 * removes the need to have guessed right.
 *
 * @param {unknown} value - the raw payload value
 */
function readDate(value: unknown): number | null {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    if (match === null) {
      return null
    }
    const timestamp = Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))

    return isNaN(timestamp) ? null : timestamp
  }
  if (typeof value === 'number' && isFinite(value)) {
    const milliseconds = Math.abs(value) < SECONDS_MILLISECONDS_THRESHOLD ? value * 1000 : value

    // Normalize to UTC midnight so an inclusive last-licensed-DAY stays a day, not an instant.
    return Math.floor(milliseconds / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY
  }

  return null
}

/**
 * A non-negative integer count of days from a payload field, or `0` when it is absent or not one.
 *
 * @param {unknown} value - the raw payload value
 */
function readDays(value: unknown): number {
  return typeof value === 'number' && isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

/**
 * The strings of a payload array field, ignoring anything that is not a non-empty string.
 *
 * @param {unknown} value - the raw payload value
 */
function readStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return (value as unknown[]).filter((item): item is string => typeof item === 'string' && item.length > 0)
}

/**
 * Reconciles the two payload shapes into one set of terms.
 *
 * `hyperformulaGrant` may be `undefined` — a key that licenses Handsontable alone still parses,
 * and HyperFormula simply gets nothing beyond {@link CORE_TOKEN} from it.
 *
 * @param {TypedKeyData} data - the extracted key data
 */
function licenseTermsOf(data: TypedKeyData): LicenseTerms {
  const hyperformulaGrant: TypedKeyProductGrant | undefined = data.payload.products[HYPERFORMULA_PRODUCT_NAME]
  const licensedGrant: TypedKeyProductGrant = data.payload.products[data.licensedProductName]
  const isRev5 = Array.isArray((hyperformulaGrant as {capabilities?: unknown} | undefined)?.capabilities)

  // CORE_TOKEN is always granted. Without it a key whose tier this version does not recognize
  // would block every built-in function, whereas HF-307 decision D3 says such a key falls back
  // to core and protected functions - not to nothing at all.
  const capabilityTokens = [CORE_TOKEN]

  if (hyperformulaGrant !== undefined) {
    if (isRev5) {
      capabilityTokens.push(...readStrings((hyperformulaGrant as {capabilities?: unknown}).capabilities))
    } else {
      if (typeof hyperformulaGrant.tier === 'string' && hyperformulaGrant.tier.length > 0) {
        capabilityTokens.push(TIER_TO_CAPABILITY_TOKEN[hyperformulaGrant.tier] ?? hyperformulaGrant.tier)
      }
      capabilityTokens.push(...readStrings(hyperformulaGrant.addons))
    }
  }

  // Expiry, grace and notice belong to the LICENSED product - for a key granting both products
  // that is Handsontable, and HyperFormula's own entry carries none of them.
  const rev5Terms = licensedGrant as {usage_until?: unknown, release_until?: unknown, notice?: unknown} | undefined
  const usageUntil = readDate(rev5Terms?.usage_until)
  const releaseUntil = readDate(rev5Terms?.release_until)
  const comparedAgainstReleaseDate = releaseUntil !== null || (usageUntil === null && data.keyType === 'perpetual')
  const expiryTimestamp = usageUntil ?? releaseUntil ?? data.expiryTimestamp
  const flags = readStrings((hyperformulaGrant as {flags?: unknown} | undefined)?.flags)
  // A perpetual licence has no grace period: its date is compared against a static build date,
  // so there is no window to be inside of.
  const graceDays = comparedAgainstReleaseDate ? 0 : readDays(licensedGrant?.grace)

  return {
    capabilityTokens,
    expiry: expiryTimestamp === null
      ? {kind: 'none', date: null, noticeDays: 0, graceDays: 0}
      : {
        kind: comparedAgainstReleaseDate ? 'release' : 'usage',
        // UTC midnight by construction, so this round-trips a payload's own `YYYY-MM-DD` exactly.
        date: new Date(expiryTimestamp).toISOString().slice(0, 10),
        noticeDays: readDays(rev5Terms?.notice),
        graceDays,
      },
    expiryTimestamp,
    comparedAgainstReleaseDate,
    graceDays,
    isTrial: data.keyType === 'trial' || flags.indexOf('trial') !== -1,
    // rev 5's `silent` flag, plus the §4.3 spelling of it. HF-307 decision D3 additionally makes
    // a key carrying tokens this version does not know silent, further down.
    silent: flags.indexOf('silent') !== -1 || flags.indexOf('silent-console') !== -1,
  }
}

/**
 * Whether an intact typed key is still valid, and if not, the day it stopped being valid.
 *
 * A key with no expiry never expires. Otherwise the expiration date is INCLUSIVE of its last
 * valid day, and a grace period extends it further. A date compared against the build's release
 * date involves no clock at all, which is what keeps an air-gapped install with a wrong system
 * clock working.
 *
 * An unknown release date resolves to "not expired", matching what the legacy validator already
 * does when `HT_RELEASE_DATE` is missing: a build that cannot tell its own age must not start
 * rejecting keys that customers paid for.
 *
 * @param {LicenseTerms} terms - the reconciled terms of the key
 */
function validityOf(terms: LicenseTerms): {state: LicenseKeyValidityState, expiredOn?: Date} {
  if (terms.expiryTimestamp === null) {
    return {state: LicenseKeyValidityState.VALID}
  }

  const now = terms.comparedAgainstReleaseDate ? releaseDateTimestamp() : Date.now()

  if (now === null) {
    return {state: LicenseKeyValidityState.VALID}
  }

  const deadline = terms.expiryTimestamp + MILLISECONDS_PER_DAY + (terms.graceDays * MILLISECONDS_PER_DAY)

  return now < deadline
    ? {state: LicenseKeyValidityState.VALID}
    : {state: LicenseKeyValidityState.EXPIRED, expiredOn: new Date(terms.expiryTimestamp)}
}

/**
 * Turns the reconciled terms of an intact, unexpired typed key into the entitlement it grants.
 *
 * Per HF-307 decision D3 this is fail-closed and silent: a token this version does not recognize
 * is recorded in `unrecognizedCapabilities` and grants nothing, without a warning, a message, or
 * anything public to read it back from.
 *
 * @param {LicenseTerms} terms - the reconciled terms of the key
 */
function entitlementOf(terms: LicenseTerms): LicenseEntitlement {
  const unrecognizedCapabilities = terms.capabilityTokens.filter((token) => !CAPABILITY_TABLE.has(token))

  return {
    unrestricted: false,
    capabilities: new Set(terms.capabilityTokens),
    unrecognizedCapabilities,
    expiry: terms.expiry,
    silent: terms.silent || unrecognizedCapabilities.length > 0,
    isTrial: terms.isTrial,
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

  const terms = licenseTermsOf(typedKeyData)
  const {state, expiredOn} = validityOf(terms)

  if (!terms.silent) {
    notifyLicenseKeyState(state, expiredOn)
  }

  return {
    validityState: state,
    entitlement: state === LicenseKeyValidityState.VALID ? entitlementOf(terms) : unrestrictedEntitlement(),
  }
}
