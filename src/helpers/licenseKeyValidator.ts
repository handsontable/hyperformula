/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

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
 * License key strings that have already printed their expiry-approaching notice.
 *
 * Deliberately keyed by the raw key string rather than a single boolean like {@link _notified}
 * above: that flag reports one of a handful of states that mean the same thing regardless of
 * which key triggered them ("a key is invalid", "a key is missing"), so once-per-page-load is the
 * right behaviour for it. Two different keys approaching their OWN expiry are two different
 * events, and a page that swaps keys (or a test suite that builds one engine per key) must still
 * warn for the second one even though the first already consumed a shared flag.
 */
const _noticedKeys = new Set<string>()

/**
 * Clears the once-per-page-load flag {@link notifyLicenseKeyState} keeps, and the per-key set
 * {@link notifyLicenseKeyNotice} keeps.
 *
 * Exists for tests only. Both are module-level and never otherwise reset, so without this the
 * whole console-message path is unobservable: the first spec to build any engine consumes the single
 * warning and every later assertion sees silence regardless of what the code does. Making the reset
 * explicit beats the alternatives — depending on spec-file order is flaky, and under Karma every
 * spec shares one browser context, so order tricks do not work there at all.
 *
 * @internal
 */
export function resetLicenseKeyNotificationForTests(): void {
  _notified = false
  _noticedKeys.clear()
}

/**
 * Prints the console message for a non-valid license key state, at most once per page load.
 *
 * Extracted so the typed-key path in `src/license/licenseResolution.ts` reports the same states
 * with the same wording and the same once-only behaviour, without duplicating the message table
 * or getting a second `_notified` flag of its own — two flags would let a page print two
 * warnings for one key.
 *
 * @param {LicenseKeyValidityState} state - the state to report; `VALID` prints nothing
 * @param {Date} [keyValidityDate] - the day the key stopped being valid, used by the `expired`
 * message
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
 * Prints a one-time notice that a VALID typed key's usage-until expiry is approaching, at most
 * once per distinct license key string.
 *
 * Called from `src/license/licenseResolution.ts`'s `resolveLicense`, alongside
 * {@link notifyLicenseKeyState} — see that function's doc for why the two share this module
 * instead of each keeping a message table and a flag of their own.
 *
 * @param {string} licenseKey - the raw key string, used only as the warn-once identity
 * @param {Date} expiryDate - the day the key's usage-until expiry falls on, at UTC midnight
 */
export function notifyLicenseKeyNotice(licenseKey: string, expiryDate: Date): void {
  if (_noticedKeys.has(licenseKey)) {
    return
  }

  console.warn(`The license key for HyperFormula will expire on ${formatDate(expiryDate)} (UTC).`)
  _noticedKeys.add(licenseKey)
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
    const releaseDays = Math.floor(new Date(`${month}/${day}/${year}`).getTime() / 8.64e7)
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
 * legacy path from a whole number of days since the epoch, the typed-key path from a calendar
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
