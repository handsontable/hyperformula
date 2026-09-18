/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/entitlement-key/utils.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 *
 * The two generation-side helpers of the upstream file (`bytesToBase64`, `stringToBase64Url`) are
 * deliberately not ported: HyperFormula reads keys, it never mints them.
 */

/**
 * The base64 alphabet.
 */
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Recursively freezes the value (and every nested object). Used to make a verified schema
 * immutable so it cannot drift from what was validated.
 *
 * @param {*} value - the value to freeze
 */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.keys(value as unknown as Record<string, unknown>).forEach(
      (key) => deepFreeze((value as unknown as Record<string, unknown>)[key])
    )
    Object.freeze(value)
  }

  return value
}

/**
 * A calendar date decomposed into its numeric parts plus the epoch milliseconds of its UTC
 * midnight.
 */
export interface ParsedIsoDate {
  year: number,
  month: number,
  day: number,
  timestamp: number,
}

/**
 * Parses the date in the `YYYY-MM-DD` format into its numeric parts and the epoch milliseconds
 * of its UTC midnight. Throws when the date is malformed or does not exist in the calendar.
 *
 * @param {string} isoDate - the date to parse
 * @param {string} dateLabel - the date name used in the error message
 */
export function parseIsoDate(isoDate: string, dateLabel: string): ParsedIsoDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(`${isoDate}`)

  if (match === null) {
    throw new Error(`The ${dateLabel} date (${isoDate}) has to be passed in the "YYYY-MM-DD" format.`)
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)

  // Date.UTC maps years 0-99 to 1900-1999, which would make the round-trip check below report a
  // "not a valid calendar date" lie.
  if (year < 100) {
    throw new Error(`The ${dateLabel} date (${isoDate}) has to use a four-digit year of 100 or later.`)
  }

  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)

  // An impossible date (e.g. "2027-02-30") makes `Date.UTC` roll over to the next month, so a
  // round-trip comparison catches it.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`The ${dateLabel} date (${isoDate}) is not a valid calendar date.`)
  }

  return {
    year, month, day, timestamp,
  }
}

/**
 * Encodes the string as UTF-8 bytes. The plain implementation is used on purpose. It does not
 * depend on `TextEncoder` or `Buffer`, so the same code works in Node.js and in every browser,
 * including plain http:// pages.
 *
 * @param {string} text - the string to encode
 */
export function stringToUtf8Bytes(text: string): number[] {
  const bytes: number[] = []

  for (let i = 0; i < text.length; i += 1) {
    let codePoint = text.charCodeAt(i)

    // Combine a surrogate pair into a single code point.
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < text.length) {
      const lowSurrogate = text.charCodeAt(i + 1)

      if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
        codePoint = ((codePoint - 0xd800) * 0x400) + (lowSurrogate - 0xdc00) + 0x10000
        i += 1
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      )
    }
  }

  return bytes
}

/**
 * Decodes UTF-8 bytes back into a string.
 *
 * @param {number[]} bytes - the bytes to decode
 */
export function utf8BytesToString(bytes: number[]): string {
  let text = ''
  let i = 0

  while (i < bytes.length) {
    const byte = bytes[i]
    let codePoint

    if (byte < 0x80) {
      codePoint = byte
      i += 1
    } else if (byte < 0xe0) {
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f)
      i += 2
    } else if (byte < 0xf0) {
      codePoint = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      i += 3
    } else {
      codePoint = ((byte & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12)
        | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)
      i += 4
    }

    if (codePoint >= 0x10000) {
      // Split the code point back into a surrogate pair.
      codePoint -= 0x10000
      text += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff))
    } else {
      text += String.fromCharCode(codePoint)
    }
  }

  return text
}

/**
 * Decodes a base64 string (standard or URL-safe alphabet, padding optional) back into bytes.
 * Returns `null` when the string is not valid base64.
 *
 * @param {string} base64 - the base64 string to decode
 */
export function base64ToBytes(base64: string): number[] | null {
  const normalized = `${base64}`.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '')

  if (!/^[A-Za-z0-9+/]*$/.test(normalized) || normalized.length % 4 === 1) {
    return null
  }

  const bytes: number[] = []

  for (let i = 0; i < normalized.length; i += 4) {
    const chunk = [0, 1, 2, 3].map((offset) => {
      const char = normalized.charAt(i + offset)

      // `indexOf('')` would return 0, so the missing characters of the last chunk have to be
      // mapped to -1 explicitly.
      return char === '' ? -1 : BASE64_ALPHABET.indexOf(char)
    })

    bytes.push((chunk[0] << 2) | (chunk[1] >> 4))

    if (chunk[2] !== -1) {
      bytes.push(((chunk[1] & 0x0f) << 4) | (chunk[2] >> 2))
    }
    if (chunk[3] !== -1) {
      bytes.push(((chunk[2] & 0x03) << 6) | chunk[3])
    }
  }

  return bytes
}

/**
 * Decodes a base64 (standard or URL-safe) string back into a string. Returns `null` when the
 * input is not valid base64.
 *
 * @param {string} base64 - the base64 string to decode
 */
export function base64ToString(base64: string): string | null {
  const bytes = base64ToBytes(base64)

  return bytes === null ? null : utf8BytesToString(bytes)
}
