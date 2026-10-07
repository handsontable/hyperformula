/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CHECKSUM_LENGTH} from '../license/handsontable-license-key-parser/constants'
import {stringToUtf8Bytes} from '../license/handsontable-license-key-parser/encoding'
import {sha512} from '../license/handsontable-license-key-parser/sha512'
import {LicenseState, UnlicensedReason} from '../license/handsontable-license-key-parser/types'
import {checkKeySchema, extractTime} from './licenseKeyHelper'

/**
 * The list of all available states which the license checker can return.
 */
export const enum LicenseKeyValidityState {
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  MISSING = 'missing'
}

type LicenseKeyInvalidState = Exclude<LicenseKeyValidityState, LicenseKeyValidityState.VALID>

interface TemplateVars {
  [key: string]: string,
}

type ConsoleMessages = {
  [key in LicenseKeyInvalidState]: (templateVars: TemplateVars) => string
}

type MessageDescriptor = {
  template: LicenseKeyValidityState,
  expiryDate?: Date,
}

/**
 * List of all not valid messages which may occur.
 */
const consoleMessages: ConsoleMessages = {
  invalid: () => 'The license key for HyperFormula is invalid.',
  expired: ({keyValidityDate}) => 'The license key for HyperFormula expired' +
    ` on ${keyValidityDate}, and is not valid for the installed version.`,
  missing: () => 'The license key for HyperFormula is missing.',
}

let _notified = false

/**
 * What an entitlement-key console message is built from: the date exactly as the key carries it
 * (never rebuilt from a timestamp) and the whole UTC days left until it.
 */
export interface EntitlementMessageParams {
  licensedUntil: string | null,
  daysRemaining: number | null,
}

/**
 * One console notification for an entitlement-key lifecycle state: its severity and its text. Kept
 * as one record so a state cannot get a text without a severity. A warning while the license still
 * works, an error once it has run out.
 */
interface EntitlementConsoleNotification {
  severity: 'warn' | 'error',
  message: (params: EntitlementMessageParams) => string,
}

const PURCHASE_LICENSE_TEXT = 'To continue using HyperFormula, you need to purchase a license.'

/**
 * A `usage_until` date is compared against the clock in UTC, so it is printed with the marker; a
 * `release_until` date involves no clock and carries none.
 */
function utcDay(isoDate: string | null): string {
  return `${isoDate} (UTC)`
}

function expiryClause(days: number | null): string {
  return days === 0 ? 'expires today' : `expires in ${days} ${days === 1 ? 'day' : 'days'}`
}

function subscriptionExpiredMessage({licensedUntil}: EntitlementMessageParams): string {
  return `Your HyperFormula subscription license expired on ${utcDay(licensedUntil)}. To continue using the software, contact sales@handsontable.com to purchase a valid license key.`
}

/**
 * The console message for each entitlement-key lifecycle state that talks to the developer: the
 * specification's text (as the vendored reader's README carries it), the same
 * table Handsontable prints (`handsontable/src/helpers/mixed.ts`, `entitlementConsoleNotifications`),
 * so one key reads the same in both products. Silent states (inside the term, a build covered by its
 * maintenance date) have no entry. A non-trial key past its grace keeps the soft-stop message: it
 * never blocks a paying customer.
 */
const ENTITLEMENT_CONSOLE_NOTIFICATIONS: Partial<Record<LicenseState, EntitlementConsoleNotification>> = {
  trial_notice: {
    severity: 'warn',
    message: ({daysRemaining}) => `Your HyperFormula license key ${expiryClause(daysRemaining)}. ${PURCHASE_LICENSE_TEXT}`,
  },
  trial_soft_stop: {
    severity: 'error',
    message: ({licensedUntil}) => `Your HyperFormula trial license key expired on ${utcDay(licensedUntil)}. ${PURCHASE_LICENSE_TEXT}`,
  },
  trial_hard_stop: {
    severity: 'error',
    message: ({licensedUntil}) => `Your HyperFormula trial license key expired on ${utcDay(licensedUntil)}. You may no longer use HyperFormula under the trial license. To continue using the software, contact sales@handsontable.com to purchase a valid license.`,
  },
  usage_notice: {
    severity: 'warn',
    message: ({licensedUntil}) => `Your HyperFormula subscription license expires on ${utcDay(licensedUntil)}. To renew your license, contact sales@handsontable.com.`,
  },
  usage_soft_stop: {severity: 'error', message: subscriptionExpiredMessage},
  usage_hard_stop: {severity: 'error', message: subscriptionExpiredMessage},
  release_expired: {
    severity: 'error',
    message: ({licensedUntil}) => `The license key for HyperFormula expired on ${licensedUntil}, and is not valid for the installed version ${process.env.HT_VERSION as string}. Renew your license key or downgrade to a version released on or before ${licensedUntil}. If you need any help, contact us at sales@handsontable.com.`,
  },
}

/**
 * The console message for each reason an entitlement key does not license HyperFormula. Both are
 * errors: neither key evaluates formulas.
 */
const UNLICENSED_CONSOLE_NOTIFICATIONS: Record<UnlicensedReason, EntitlementConsoleNotification> = {
  unreadable: {
    severity: 'error',
    message: () => 'The license key for HyperFormula is invalid. If you need any help, contact us at support@handsontable.com.',
  },
  product_missing: {
    severity: 'error',
    message: () => 'The license key does not include a license for HyperFormula. To purchase one, contact sales@handsontable.com.',
  },
}

/**
 * Entitlement messages already printed, each as a key identity (see {@link keyIdentityOf}) plus
 * the message text: "each distinct message once per key per page", as the specification asks. Two
 * keys on one page are two licenses, and one key moving into a new state is a new message. Kept apart from {@link _notified},
 * which serves classic 25-character keys and stays a single flag, unchanged.
 */
const _notifiedEntitlementKeys = new Set<string>()

/**
 * Clears the once-per-page-load flag {@link notifyLicenseKeyState} keeps, and the per-key set
 * {@link notifyEntitlementKey} keeps.
 *
 * Exists for tests only. Both are module-level and never otherwise reset, so without this the
 * whole console-message path is unobservable: the first spec to build any engine consumes the
 * message and every later assertion sees silence regardless of what the code does. Under Karma
 * every spec shares one browser context, so spec-order tricks do not work there at all.
 *
 * @internal
 */
export function resetLicenseKeyNotificationForTests(): void {
  _notified = false
  _notifiedEntitlementKeys.clear()
}

/**
 * Prints the console message for a classic 25-character key's non-valid state, at most once per
 * page load. Entitlement keys do not go through this function.
 *
 * @param {LicenseKeyValidityState} state - the state to report; `VALID` prints nothing
 * @param {Date} [keyValidityDate] - the day the key stopped being valid, used by the `expired` message
 */
export function notifyLicenseKeyState(state: LicenseKeyValidityState, keyValidityDate?: Date): void {
  if (_notified || state === LicenseKeyValidityState.VALID) {
    return
  }

  const vars: TemplateVars = keyValidityDate === undefined ? {} : {keyValidityDate: formatDate(keyValidityDate)}

  console.warn(consoleMessages[state](vars))
  _notified = true
}

/**
 * Prints the console message for an entitlement key, at most once per distinct key per page.
 *
 * @param {string} licenseKey - the raw key; only its identity is retained
 * @param {LicenseState | UnlicensedReason} state - the reader's lifecycle state, or why the key does not license HyperFormula
 * @param {EntitlementMessageParams} params - the key's own date and days remaining
 */
export function notifyEntitlementKey(licenseKey: string, state: LicenseState | UnlicensedReason, params: EntitlementMessageParams): void {
  const notification: EntitlementConsoleNotification | undefined = state === 'unreadable' || state === 'product_missing'
    ? UNLICENSED_CONSOLE_NOTIFICATIONS[state]
    : ENTITLEMENT_CONSOLE_NOTIFICATIONS[state]

  if (notification === undefined) {
    return
  }

  // Keyed by the key AND the text, not the key alone: on a page that stays open while a key moves
  // from its notice window into expiry, the expiry message is a different message and must still
  // print. A soft stop and a hard stop share one text, so the hard stop does not repeat it.
  const text = notification.message(params)
  const identity = `${keyIdentityOf(licenseKey)}\n${text}`

  if (_notifiedEntitlementKeys.has(identity)) {
    return
  }

  if (notification.severity === 'error') {
    console.error(text)
  } else {
    console.warn(text)
  }
  _notifiedEntitlementKeys.add(identity)
}

/**
 * The identity of a key: the SHA-512 of the key with every character the reader ignores removed,
 * unique per distinct key content. A rewrapped key and its one-line form are one license to the
 * reader, so they are one identity here too. Two keys that share a block but differ in their prose
 * are two keys - the payload carries a digest of the prose - so they are two identities. Hashed
 * because the set lives as long as the page: a server building one engine per customer key would
 * otherwise keep every full key string it has ever seen.
 */
function keyIdentityOf(licenseKey: string): string {
  return sha512(stringToUtf8Bytes(withoutIgnoredCharacters(licenseKey).normalize('NFC')))
}

/**
 * The checksum of an entitlement key: the last 128 characters of its block. The block is found
 * the way the reader finds it - the last `[` and the first `]` after it - and read without the
 * characters the reader ignores, so a key wrapped inside its block, or followed by a line break,
 * reports the same checksum as its one-line form.
 *
 * @param {string} licenseKey - an entitlement key, as the user passed it
 * @returns {string} the checksum
 */
export function entitlementKeyChecksumOf(licenseKey: string): string {
  const blockStart = licenseKey.lastIndexOf('[')
  const blockEnd = licenseKey.indexOf(']', blockStart + 1)

  return withoutIgnoredCharacters(licenseKey.slice(blockStart + 1, blockEnd)).slice(-CHECKSUM_LENGTH)
}

/**
 * The text without the characters the reader ignores anywhere in a key: every line break or tab
 * saved as text (`\n`, `\r`, `\t`, as a `.env` file stores one), then every whitespace character.
 * Removed in the reader's order, escapes first; `\s` is exactly the set of characters the reader
 * treats as whitespace.
 */
function withoutIgnoredCharacters(text: string): string {
  return text.replace(/\\[nrt]/g, '').replace(/\s+/g, '')
}

/**
 * Checks if the provided license key is grammatically valid or not expired.
 *
 * @param {string} licenseKey The license key to check.
 * @returns {LicenseKeyValidityState} Returns the checking state.
 */
export function checkLicenseKeyValidity(licenseKey: string): LicenseKeyValidityState {
  const messageDescriptor: MessageDescriptor = {
    template: LicenseKeyValidityState.MISSING,
  }

  if (licenseKey === 'gpl-v3' || licenseKey === 'internal-use-in-handsontable' || licenseKey === 'hftrial-0168e-1f2b7-47158-70b05-0842f') {
    messageDescriptor.template = LicenseKeyValidityState.VALID

  } else if (typeof licenseKey === 'string' && checkKeySchema(licenseKey)) {
    const [day, month, year] = (process.env.HT_RELEASE_DATE || '').split('/')
    // UTC, not `new Date('MM/DD/YYYY')`: local parsing puts the release day one day early east of UTC.
    const releaseDays = Math.floor(Date.UTC(Number(year), Number(month) - 1, Number(day)) / 8.64e7)
    const keyValidityDays = extractTime(licenseKey)

    messageDescriptor.expiryDate = new Date((keyValidityDays + 1) * 8.64e7)

    if (releaseDays > keyValidityDays) {
      messageDescriptor.template = LicenseKeyValidityState.EXPIRED
    } else {
      messageDescriptor.template = LicenseKeyValidityState.VALID
    }

  } else if (licenseKey !== '') {
    messageDescriptor.template = LicenseKeyValidityState.INVALID
  }

  notifyLicenseKeyState(messageDescriptor.template, messageDescriptor.expiryDate)

  return messageDescriptor.template
}

/**
 * Formats a Date instance to hard-coded format MMMM DD, YYYY.
 *
 * Read in UTC, not local time. Every date reaching this function is built at UTC midnight — the
 * legacy path from a whole number of days since the epoch, the entitlement-key path from a calendar
 * date in the payload — so local getters shifted the day backwards for anyone west of UTC and
 * printed an expiry one day earlier than the one the key actually carries.
 *
 * @param {Date} date The date to format, at UTC midnight.
 * @returns {string} The date as `MMMM DD, YYYY`.
 */
function formatDate(date: Date): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  return `${month} ${day}, ${year}`
}
