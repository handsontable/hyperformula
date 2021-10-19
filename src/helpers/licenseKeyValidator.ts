/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
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
  vars: TemplateVars,
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
 * Checks if the provided license key is grammatically valid or not expired.
 *
 * @param {string} licenseKey The license key to check.
 * @returns {LicenseKeyValidityState} Returns the checking state.
 */
export function checkLicenseKeyValidity(licenseKey: string): LicenseKeyValidityState {
  const messageDescriptor: MessageDescriptor = {
    template: LicenseKeyValidityState.MISSING,
    vars: {},
  }

  if (licenseKey === 'gpl-v3' || licenseKey === 'internal-use-in-handsontable') {
    messageDescriptor.template = LicenseKeyValidityState.VALID

  } else if (typeof licenseKey === 'string' && checkKeySchema(licenseKey)) {
    const [day, month, year] = (process.env.HT_RELEASE_DATE || '').split('/')
    const releaseDays = Math.floor(new Date(`${month}/${day}/${year}`).getTime() / 8.64e7)
    const keyValidityDays = extractTime(licenseKey)

    messageDescriptor.vars.keyValidityDate = formatDate(new Date((keyValidityDays + 1) * 8.64e7))

    if (releaseDays > keyValidityDays) {
      messageDescriptor.template = LicenseKeyValidityState.EXPIRED
    } else {
      messageDescriptor.template = LicenseKeyValidityState.VALID
    }

  } else if (licenseKey !== '') {
    messageDescriptor.template = LicenseKeyValidityState.INVALID
  }

  if (!_notified && messageDescriptor.template !== LicenseKeyValidityState.VALID) {
    console.warn(consoleMessages[messageDescriptor.template](messageDescriptor.vars))
    _notified = true
  }

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
