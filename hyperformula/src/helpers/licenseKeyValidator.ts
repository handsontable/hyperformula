/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {LicenseState} from '../license/handsontable-license-key-parser'
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
 * List of all not valid messages which may occur: Handsontable's text
 * (`handsontable/src/helpers/mixed.ts`, `consoleMessages`), with HyperFormula as the product.
 */
const consoleMessages: ConsoleMessages = {
  invalid: () => 'The license key for HyperFormula is invalid.' +
    ' If you need any help, contact us at support@handsontable.com.',
  expired: ({keyValidityDate}) => `The license key for HyperFormula expired on ${keyValidityDate}, and is not valid` +
    ` for the installed version ${process.env.HT_VERSION as string}. Renew your license key at handsontable.com or` +
    ` downgrade to a version released prior to ${keyValidityDate}. If you need any help, contact us at sales@handsontable.com.`,
  missing: () => 'The license key for HyperFormula is missing. Use your purchased key to activate the product.' +
    ' If you need any help, contact us at support@handsontable.com.',
}

let _notified = false

/**
 * What an entitlement-key lifecycle message is built from: the date exactly as the key carries it
 * (never rebuilt from a timestamp) and the whole UTC days left until it.
 */
export interface EntitlementMessageParams {
  licensedUntil: string,
  /** `null` for a `release_until` key, which is compared with the build date and reads no clock. */
  daysRemaining: number | null,
}

/**
 * One console notification for an entitlement key: its severity and its text. Kept as one record
 * so a state cannot get a text without a severity. A warning while the license still works, an
 * error once it has run out.
 */
interface EntitlementConsoleNotification<Params> {
  severity: 'warn' | 'error',
  message: (params: Params) => string,
}

const PURCHASE_LICENSE_TEXT = 'To continue using HyperFormula, you need to purchase a license.'

/**
 * Formats a `usage_until` date for a message. It is compared against the clock in UTC, so it is
 * printed with the marker; a `release_until` date involves no clock and is printed without one.
 *
 * @param {string} isoDate - the date as the key carries it, `YYYY-MM-DD`
 */
function utcDay(isoDate: string): string {
  return `${isoDate} (UTC)`
}

/**
 * The countdown of a trial notice: `expires today`, `expires in 1 day` or `expires in N days`.
 *
 * @param {number} days - the whole UTC days left until the last licensed day
 */
function expiryClause(days: number): string {
  return days === 0 ? 'expires today' : `expires in ${days} ${days === 1 ? 'day' : 'days'}`
}

/**
 * The message of a subscription past its `usage_until` date, inside its grace period or after it.
 *
 * @param {EntitlementMessageParams} params - the key's own date
 */
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
const ENTITLEMENT_CONSOLE_NOTIFICATIONS: Partial<Record<LicenseState, EntitlementConsoleNotification<EntitlementMessageParams>>> = {
  trial_notice: {
    severity: 'warn',
    // A trial in its notice window is always a `usage_until` key, so the reader counted its days.
    message: ({daysRemaining}) => `Your HyperFormula license key ${expiryClause(daysRemaining as number)}. ${PURCHASE_LICENSE_TEXT}`,
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
 * The console message for an entitlement key that does not license HyperFormula, whatever the
 * reason: the classic invalid-key message, as a warning. Handsontable does the same
 * (`handsontable/src/helpers/mixed.ts`, `_injectEntitlementProductInfo`): an unreadable key and a key
 * for other products only are the same failure to the developer, and the key specification leaves
 * the wording open.
 */
const UNLICENSED_CONSOLE_NOTIFICATION: EntitlementConsoleNotification<void> = {
  severity: 'warn',
  message: () => consoleMessages.invalid({}),
}

/**
 * Clears the once-per-page-load flag {@link notifyLicenseKeyState} keeps.
 *
 * Exists for tests only. The flag is module-level and never otherwise reset, so without this the
 * classic-key message path is unobservable: the first spec to build any engine consumes the
 * message and every later assertion sees silence regardless of what the code does. Under Karma
 * every spec shares one browser context, so spec-order tricks do not work there at all.
 *
 * @internal
 */
export function resetLicenseKeyNotificationForTests(): void {
  _notified = false
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
 * Prints the console message for an entitlement key's lifecycle state, every time a key is
 * resolved: unlike classic keys, entitlement keys keep no record of what they already printed.
 * States inside the term print nothing.
 *
 * @param {LicenseState} state - the reader's lifecycle state
 * @param {EntitlementMessageParams} params - the key's own date and days remaining
 */
export function notifyEntitlementKey(state: LicenseState, params: EntitlementMessageParams): void {
  const notification = ENTITLEMENT_CONSOLE_NOTIFICATIONS[state]

  if (notification !== undefined) {
    printNotification(notification.severity, notification.message(params))
  }
}

/**
 * Prints the console message for an entitlement key that does not license HyperFormula, every
 * time such a key is resolved. Every reason the reader gives prints the same message.
 */
export function notifyUnlicensedEntitlementKey(): void {
  printNotification(UNLICENSED_CONSOLE_NOTIFICATION.severity, UNLICENSED_CONSOLE_NOTIFICATION.message())
}

/**
 * Prints `text` on the console channel that matches `severity`.
 *
 * @param {'warn' | 'error'} severity - `warn` while the license still works, `error` once it does not
 * @param {string} text - the message
 */
function printNotification(severity: 'warn' | 'error', text: string): void {
  if (severity === 'error') {
    console.error(text)
  } else {
    console.warn(text)
  }
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

  if (licenseKey === 'internal-use-in-handsontable' || licenseKey === 'hftrial-0168e-1f2b7-47158-70b05-0842f') {
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
  const day = String(date.getUTCDate()).padStart(2, '0')
  const year = date.getUTCFullYear()

  return `${month} ${day}, ${year}`
}
