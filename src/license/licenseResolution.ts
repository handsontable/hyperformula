/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  checkLicenseKeyValidity,
  LicenseKeyValidityState,
  notifyLicenseKeyNotice,
  notifyLicenseKeyState,
} from '../helpers/licenseKeyValidator'
import {ALL_FEATURE_TOKENS, CAPABILITY_TABLE, CORE_TOKEN} from './capabilities'
import {LicenseEntitlement, LicenseExpiry, unrestrictedEntitlement} from './LicenseEntitlement'
import {detectLicenseKeyFormat} from './vendor/detectFormat'
import {EntitlementKeyData, EntitlementProductGrant, extractEntitlementKeyData} from './vendor/extractKeyData'
import {parseIsoDate} from './vendor/utils'

/** Milliseconds in a day, used to turn a grace period in days into a deadline. */
const MILLISECONDS_PER_DAY = 86400000

/**
 * The name of HyperFormula's own product entry in an entitlement key payload. Every product
 * entry carries its own capabilities, dates and windows, so this is the only entry this library
 * reads — a key granting other products alongside (or instead of) HyperFormula is a valid key
 * whose other entries are simply not for us.
 */
export const HYPERFORMULA_PRODUCT_NAME = 'hyperformula'

/**
 * The prefix marking a capability token as granting a public-API feature area.
 *
 * Used to tell "this key names its feature grants" from "this key's vocabulary cannot express
 * one" — see the opt-in rule in {@link licenseTermsOf}.
 */
const FEATURE_TOKEN_PREFIX = 'feat:'

/**
 * Flag spellings that suppress console output.
 *
 * Three, because the key spec is not self-consistent: its normative flags table and its example
 * payload (rev 6 §2.3 and §2) say `no-console-warns`, while the runtime-behaviour sections of the
 * same revision (§4.3, §5.2) say `silent-console`, and earlier revisions said plain `silent`. A key
 * minted against any of those readings must be honoured — a SaaS deployment that asked for silence
 * and got console warnings is the failure this list exists to prevent.
 */
const SILENT_CONSOLE_FLAGS = ['silent', 'silent-console', 'no-console-warns']

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
 * What HyperFormula needs from an entitlement key, read from its own product entry.
 *
 * The entry's shape is guaranteed by the vendored reader ({@link extractEntitlementKeyData}
 * returns `null` for anything malformed), so unlike the typed-key adapter this replaces, nothing
 * here re-checks field types or reconciles competing payload shapes: the entitlement format is
 * the only shape there is, and a key granting HyperFormula nothing is simply a key with no
 * `hyperformula` entry.
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
 * Read from the same `HT_RELEASE_DATE` (`DD/MM/YYYY`) the legacy validator uses, but **parsed
 * differently on purpose**, and the difference is observable — so do not "simplify" either one to
 * match the other without reading this.
 *
 * This function uses `Date.UTC`. The legacy validator builds the same value with
 * `new Date(month/day/year)`, which is parsed in the host's LOCAL zone. East of UTC the two land on
 * different day numbers for one and the same release date:
 *
 * ```text
 * HT_RELEASE_DATE=10/08/2026        legacy (local)   this function (UTC)
 *   TZ=UTC, TZ=America/Los_Angeles      20675              20675     agree
 *   TZ=Asia/Tokyo                       20674              20675     differ by a day
 *   TZ=Pacific/Kiritimati               20674              20675     differ by a day
 * ```
 *
 * UTC is the required reading for an entitlement key: key spec rev 6 §1.2 makes offline/online
 * parity a hard rule — the offline check and a future online check must return the same verdict
 * for the same key at the same instant — and any rule reading a local clock breaks it. The legacy
 * path keeps its local parse because legacy behaviour is frozen for this release; switching it
 * would move the expiry verdict of already-issued legacy keys by a day for every customer east
 * of UTC.
 *
 * The consequence, flagged rather than hidden: two customers east of UTC, one on a legacy key and
 * one on an equivalent entitlement key, can disagree by a day about whether this build is covered.
 * Reconciling them is a product decision, not a refactor.
 */
function releaseDateTimestamp(): number | null {
  const [day, month, year] = (process.env.HT_RELEASE_DATE ?? '').split('/')
  const timestamp = Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))

  return isNaN(timestamp) ? null : timestamp
}

/**
 * Reads HyperFormula's terms out of an intact entitlement key payload.
 *
 * Total on purpose: the vendored reader has already rejected every malformed shape, so every
 * field read here is exactly what {@link EntitlementProductGrant} promises. A payload without a
 * `hyperformula` entry — including `products: {}` — is a VALID key that grants this library
 * nothing and never expires for it; per HF-307 decision D6-A that cliff is silent. Note this
 * differs from the typed-key format this replaces, where a key licensed to another product
 * carried the expiry HyperFormula was checked against: an entitlement key's product entries each
 * carry their own terms, so another product's dates are not ours to read.
 *
 * @param {EntitlementKeyData} data - the extracted key data
 */
function licenseTermsOf(data: EntitlementKeyData): LicenseTerms {
  const grant: EntitlementProductGrant | undefined = data.products[HYPERFORMULA_PRODUCT_NAME]

  // CORE_TOKEN is always granted, but note what it actually grants: the calculation operators -
  // NOT a usable set of functions. A key whose only tokens this build does not recognize therefore
  // evaluates operators and protected built-ins and returns #LIC! for every function call,
  // silently, per HF-307 decision D3. That cliff is ratified as-is (D6-A): "this
  // situation should never happen. There is no point in issuing a key if empty capabilities."
  const capabilityTokens = [CORE_TOKEN]

  if (grant !== undefined) {
    // Appended one by one rather than with `push(...grant.capabilities)`. The array comes from an
    // attacker-influenced payload and the format sets no size limit (the spec addendum lists
    // "payload size" as an open question on its own page), and spreading an array into a call puts
    // one argument per stack slot: measured, a checksum-valid key carrying 125 000 tokens threw
    // `RangeError: Maximum call stack size exceeded` out of `HyperFormula.buildFromArray` instead
    // of resolving to a verdict. A malformed or hostile key must produce INVALID, never a throw.
    grant.capabilities.forEach((token) => capabilityTokens.push(token))
  }

  // Feature tokens are OPT-IN, never opt-out. A key carrying at least one `feat:*` token demonstrably
  // speaks the feature vocabulary, so it gets exactly the areas it names - that is what makes feature
  // gating real (the ratified decision: "Feature gating should work"). A key carrying NONE cannot
  // be saying "no features", because no vocabulary in circulation can express one: the key spec's
  // current HyperFormula token list (rev 6 §2.2 - `functions_1..4`, `spreadsheet`,
  // `import_export`) contains no `feat:*` entry at all. So absence means "this key does not talk
  // about features", and the task's additive-safety rule - a grant may grow between versions,
  // never shrink - makes the whole gated API the only safe reading.
  //
  // Reading absence as denial instead would hand a dead public API to every key myHOT can mint
  // today, HyperFormula-only and Handsontable-only alike; both were verified doing exactly that
  // before this rule existed.
  // The trigger is a feature token this version RECOGNIZES, not merely one that looks like a
  // feature token. An unrecognized `feat:*` token has to be inert (D3: "unrecognized token should
  // not grant the capability (silently ignored)"), and a purely syntactic prefix test makes it the
  // opposite of inert - it suppresses the fallback, so the key ends up with ZERO of the five areas.
  // Measured before this guard existed: a key carrying `functions_1` plus a single unknown
  // `feat:teleport` had CRUD, undo, clipboard, named expressions and batching all throwing, while
  // the same key without that token had all five. That is the additive-safety rule inverted - an
  // older build meeting a key minted by a newer generator, or a one-character typo at issuing time,
  // would revoke the whole gated API rather than ignore a word it does not know.
  const namesAKnownFeature = capabilityTokens.some(
    (token) => token.indexOf(FEATURE_TOKEN_PREFIX) === 0 && CAPABILITY_TABLE.has(token)
  )

  if (!namesAKnownFeature) {
    capabilityTokens.push(...ALL_FEATURE_TOKENS)
  }

  // Exactly one of the two date fields is present on an intact entry (the reader enforces it),
  // and the date used and the axis it is compared against come from that same field. The date is
  // carried as the payload's own `YYYY-MM-DD` string, never routed through `Date` formatting -
  // the key spec's fixture J11 exists because `toISOString()` shortens every licence issued east
  // of UTC by a day.
  const expiryDate = grant === undefined ? undefined : (grant.usage_until ?? grant.release_until)
  const comparedAgainstReleaseDate = grant !== undefined && grant.release_until !== undefined
  const expiryTimestamp = expiryDate === undefined ? null : parseIsoDate(expiryDate, 'expiration').timestamp
  const flags = grant === undefined ? [] : grant.flags
  // A release-date comparison has no grace period: it is static, so there is no window to be
  // inside of.
  const graceDays = comparedAgainstReleaseDate || grant === undefined ? 0 : grant.grace

  return {
    capabilityTokens,
    expiry: expiryDate === undefined || expiryTimestamp === null
      ? {kind: 'none', date: null, noticeDays: 0, graceDays: 0}
      : {
        kind: comparedAgainstReleaseDate ? 'release' : 'usage',
        date: expiryDate,
        // Read off HyperFormula's OWN entry, which is what makes the shape gate structural here:
        // the tagged format took its terms from the LICENSED product's entry, so a `notice` field
        // another product added for its own purposes could switch HyperFormula's console output
        // on (fixed under gate in the previous PR). An entitlement key carries per-entry terms, so
        // another product's `notice` is not reachable from here at all.
        noticeDays: grant === undefined ? 0 : grant.notice,
        graceDays,
      },
    expiryTimestamp,
    comparedAgainstReleaseDate,
    graceDays,
    isTrial: flags.indexOf('trial') !== -1,
    // Every spelling the key spec uses for "suppress console output" - see SILENT_CONSOLE_FLAGS.
    // The key's flags are the ONLY source of silence: an earlier revision also silenced any key
    // carrying an unrecognized token, which suppressed strictly more than D3 asks for (it would
    // have swallowed expiry notices too). That was confirmed an implementation error.
    silent: flags.some((flag) => SILENT_CONSOLE_FLAGS.indexOf(flag) !== -1),
  }
}

/**
 * Whether an intact entitlement key is still valid, and if not, the day it stopped being valid.
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
 * @param {LicenseTerms} terms - the terms of the key
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
    // The reported day is the first day NOT covered, which is the convention the legacy validator
    // already uses for the same message (it reports `keyValidityDays + 1`).
    : {state: LicenseKeyValidityState.EXPIRED, expiredOn: new Date(deadline)}
}

/**
 * The day a VALID key's usage-until expiry falls on, if the current UTC instant is within its
 * notice window — `null` otherwise, which covers "no notice window configured" (`noticeDays` is
 * `0`, which is also what a key with no HyperFormula entry resolves to) just as much as "not close
 * enough yet" or "already past its usage-until day".
 *
 * Deliberately blind to `graceDays`: notice is about the usage_until axis itself, not about the
 * grace extension past it. Key spec rev 6 §4.1 sequences notice, then a soft-stop window, then the
 * hard-stop this build already enforces; only the hard stop and this notice are built for 3.5.0
 * (decision D5-A), so the window checked here ends exactly where the soft-stop phase would
 * begin, rather than reaching into grace and printing a notice for a key already past its expiry.
 *
 * `release_until`-axis keys never reach here with a non-`null` result — `kind` is `'usage'` only
 * when the date came from `usage_until` (see {@link licenseTermsOf}) — matching the spec's rule
 * that notice and grace have no effect on that axis. The converse holds too now: the tagged
 * format let an entry with no date of its own fall through to the key envelope's `exp`, so
 * `'usage'` did not imply `usage_until`; an entitlement key has no envelope date to fall back to.
 *
 * @param {LicenseTerms} terms - the terms of the key
 */
function expiryWithinNoticeWindow(terms: LicenseTerms): Date | null {
  if (terms.expiry.kind !== 'usage' || terms.expiry.noticeDays <= 0 || terms.expiryTimestamp === null) {
    return null
  }

  // The window ends at the first instant no longer on the usage_until day — the same boundary
  // `validityOf` uses before adding its grace term — and opens `notice` days before the licensed
  // day ITSELF, not before that end. Counting back from the end would shorten the window by a day:
  // the date-semantics fixtures pin 2027-06-13T00:00:00Z for usage_until 2027-08-12 with notice 60,
  // and a trial whose notice equals its whole term must warn from the day it is issued.
  const usageAxisDeadline = terms.expiryTimestamp + MILLISECONDS_PER_DAY
  const noticeWindowStart = terms.expiryTimestamp - (terms.expiry.noticeDays * MILLISECONDS_PER_DAY)
  const now = Date.now()

  return now >= noticeWindowStart && now < usageAxisDeadline ? new Date(terms.expiryTimestamp) : null
}

/**
 * Turns the terms of an intact, unexpired entitlement key into the entitlement it grants.
 *
 * Per HF-307 decision D3 this is fail-closed and silent: a token this version does not recognize
 * is recorded in `unrecognizedCapabilities` and grants nothing, without a warning, a message, or
 * anything public to read it back from. "Silent" there means the *grant* is silent — whether the
 * key's console messages are suppressed is decided solely by its `flags` (`terms.silent`), never
 * by the presence of an unrecognized token; coupling the two suppressed expiry notices as a side
 * effect of a vocabulary mismatch, and was confirmed an implementation error.
 *
 * @param {LicenseTerms} terms - the terms of the key
 */
function entitlementOf(terms: LicenseTerms): LicenseEntitlement {
  const unrecognizedCapabilities = terms.capabilityTokens.filter((token) => !CAPABILITY_TABLE.has(token))

  return {
    unrestricted: false,
    capabilities: new Set(terms.capabilityTokens),
    unrecognizedCapabilities,
    expiry: terms.expiry,
    silent: terms.silent,
    isTrial: terms.isTrial,
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
    return {
      validityState: checkLicenseKeyValidity(licenseKey),
      entitlement: unrestrictedEntitlement(),
    }
  }

  const data = extractEntitlementKeyData(licenseKey)

  if (data === null) {
    if (notifyConsole) {
      notifyLicenseKeyState(LicenseKeyValidityState.INVALID)
    }

    return {validityState: LicenseKeyValidityState.INVALID, entitlement: unrestrictedEntitlement()}
  }

  const terms = licenseTermsOf(data)
  const {state, expiredOn} = validityOf(terms)

  if (notifyConsole && !terms.silent) {
    notifyLicenseKeyState(state, expiredOn)

    if (state === LicenseKeyValidityState.VALID) {
      const noticeExpiryDate = expiryWithinNoticeWindow(terms)

      if (noticeExpiryDate !== null) {
        notifyLicenseKeyNotice(licenseKey, noticeExpiryDate)
      }
    }
  }

  return {
    validityState: state,
    entitlement: state === LicenseKeyValidityState.VALID ? entitlementOf(terms) : unrestrictedEntitlement(),
  }
}
