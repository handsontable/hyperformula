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
 * @param {Date} date The date to format.
 * @returns {string}
 */
function formatDate(date: Date): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  return `${month} ${day}, ${year}`
}
