/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/entitlement-key/extract-key-data.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 *
 * Unlike the typed-key reader this file replaces, the entitlement reader is deliberately
 * SCHEMA-FREE upstream: unknown products, capabilities and flags are all tolerated, so nothing
 * about reading a key depends on the vocabulary — which is what lets a product vendor this
 * parser on its own.
 */

import {DATE_FIELDS, ENTITLEMENT_KEY_CHECKSUM_LENGTH} from './constants'
import {sha512} from './sha512'
import {base64ToString, parseIsoDate, stringToUtf8Bytes} from './utils'

/**
 * The alphabet of the encoded payload — URL-safe base64 without padding. The checksum (lowercase
 * hex) is a subset of it, which is what lets the two be split by a fixed length from the right.
 */
const ENCODED_PAYLOAD = /^[A-Za-z0-9\-_]+$/
const CHECKSUM = /^[0-9a-f]+$/

/**
 * One normalized product entry of an entitlement key payload.
 *
 * The named fields are guaranteed by {@link normalizeProductEntry}: `capabilities` and `flags`
 * are arrays of strings (`flags` normalized to `[]` when absent), `notice` and `grace` are
 * non-negative integers, and exactly one of `usage_until` / `release_until` is present and is a
 * real `YYYY-MM-DD` calendar date. Any OTHER field the entry carries is preserved verbatim under
 * its own name — a field added to the format later must reach an application running an older
 * vendored parser — which is what the index signature is for.
 */
export interface EntitlementProductGrant {
  readonly capabilities: readonly string[],
  readonly usage_until?: string,
  readonly release_until?: string,
  readonly notice: number,
  readonly grace: number,
  readonly flags: readonly string[],
  readonly [field: string]: unknown,
}

/**
 * The machine-readable content of an intact entitlement license key: the granted products, each
 * with its capabilities, its single date (`usage_until` or `release_until`), its `notice` and
 * `grace` windows in days, and its `flags`.
 */
export interface EntitlementKeyData {
  readonly products: Readonly<Record<string, EntitlementProductGrant>>,
}

/**
 * Returns `true` when the value is a plain object.
 *
 * @param {unknown} value - the value to check
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Returns `true` when the value is a non-negative integer.
 *
 * @param {unknown} value - the value to check
 */
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value && value >= 0
}

/**
 * Returns `true` when the value is an array of strings.
 *
 * @param {unknown} value - the value to check
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Returns `true` when the value is a real calendar date in the `YYYY-MM-DD` format. A time
 * component, an offset, a numeric timestamp and a date that does not exist are all rejected —
 * the format is the whole contract, and a validator that accepted two spellings would hide a
 * timezone bug at generation instead of surfacing it.
 *
 * @param {unknown} value - the value to check
 */
function isIsoDate(value: unknown): boolean {
  // `parseIsoDate` stringifies its argument before matching the `YYYY-MM-DD` shape, so a value
  // that is not a string but spells a date once stringified — a single-element array is the
  // realistic case — would pass a shape check the format makes fatal, and a malformed key would
  // end up granting a RESTRICTED entitlement instead of taking the invalid-key path. The type is
  // part of the shape, so it is rejected here rather than left to the stringifying matcher.
  if (typeof value !== 'string') {
    return false
  }

  try {
    parseIsoDate(value, 'license')

    return true
  } catch (error) {
    return false
  }
}

/**
 * Adds an own, ordinary property.
 *
 * Both the product names and the field names of a product entry come from JSON, so `__proto__`
 * is a name an attacker can put in a key. A plain assignment would go through the
 * `Object.prototype` setter: the value would vanish from `Object.keys` while still resolving
 * through the chain.
 *
 * @param {object} target - the object to add the property to
 * @param {string} key - the property name
 * @param {unknown} value - the property value
 */
function defineOwn(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value, enumerable: true, writable: true, configurable: true,
  })
}

/**
 * Verifies and normalizes one product entry.
 *
 * Strict about SHAPE: exactly one of the two dates, a real date, and the two window sizes. A key
 * that gets this wrong is malformed, not merely unknown, and reading it would mean guessing what
 * was licensed.
 *
 * Lenient about VOCABULARY: an unrecognised capability token, an unrecognised flag and an
 * unrecognised extra field are all kept and ignored. Without that leniency every token added on
 * the issuing side would break every library version already deployed in the field.
 *
 * Returns `null` when the entry is malformed.
 *
 * @param {unknown} entry - the product entry of the payload
 */
function normalizeProductEntry(entry: unknown): EntitlementProductGrant | null {
  if (!isPlainObject(entry)) {
    return null
  }
  if (!isStringArray(entry.capabilities)) {
    return null
  }

  const presentDateFields = DATE_FIELDS.filter((field) => entry[field] !== undefined)

  // Exactly one date per product. "Both" and "neither" are each a different commercial shape
  // that the format cannot express, so neither may be silently resolved by whichever field the
  // parser happens to read first.
  if (presentDateFields.length !== 1) {
    return null
  }
  if (!isIsoDate(entry[presentDateFields[0]])) {
    return null
  }
  if (!isNonNegativeInteger(entry.notice) || !isNonNegativeInteger(entry.grace)) {
    return null
  }
  if (entry.flags !== undefined && !isStringArray(entry.flags)) {
    return null
  }

  // Start from everything the entry carries, so a field this version does not know survives
  // into the result instead of being silently dropped. A field added to the format later is
  // exactly the case an already-vendored parser has to survive, and a reader that quietly
  // discards it makes the field invisible to the application on top.
  const normalized = {}

  Object.keys(entry).forEach((field) => defineOwn(normalized, field, entry[field]))

  defineOwn(normalized, 'capabilities', entry.capabilities.slice())
  defineOwn(normalized, 'notice', entry.notice)
  defineOwn(normalized, 'grace', entry.grace)
  // An absent array and an empty one mean the same thing. Normalizing here keeps
  // `flags.indexOf('trial')` safe at every call site.
  defineOwn(normalized, 'flags', entry.flags === undefined ? [] : entry.flags.slice())
  defineOwn(normalized, presentDateFields[0], entry[presentDateFields[0]])

  return normalized as EntitlementProductGrant
}

/**
 * Extracts the machine-readable data from an entitlement license key.
 *
 * The checksum is verified first, so the returned data is guaranteed to belong to an intact
 * block. For a malformed or tampered key `null` is returned — reporting an invalid key is the
 * caller's job, not this function's.
 *
 * Only the bracketed block matters. The prose in front of it is neither parsed nor covered by
 * the checksum, so the caller may pass the whole artifact or just the `[...]` block, and
 * rewrapped or re-pasted text still validates.
 *
 * No schema is needed. Unknown products, capabilities and flags are all tolerated, so nothing
 * about reading a key depends on the vocabulary — which is what lets a product vendor this
 * parser on its own.
 *
 * @param {string} licenseKey - the license key to extract the data from
 */
export function extractEntitlementKeyData(licenseKey: string): EntitlementKeyData | null {
  if (typeof licenseKey !== 'string') {
    return null
  }

  // The machine-readable block closes the key. Searching backwards means a bracket inside the
  // prose cannot shadow it.
  const blockStart = licenseKey.lastIndexOf('[')

  if (blockStart === -1) {
    return null
  }

  const blockEnd = licenseKey.indexOf(']', blockStart)

  if (blockEnd === -1) {
    return null
  }

  const content = licenseKey.slice(blockStart + 1, blockEnd)

  if (content.length <= ENTITLEMENT_KEY_CHECKSUM_LENGTH) {
    return null
  }

  const encodedPayload = content.slice(0, -ENTITLEMENT_KEY_CHECKSUM_LENGTH)
  const checksum = content.slice(-ENTITLEMENT_KEY_CHECKSUM_LENGTH)

  if (!ENCODED_PAYLOAD.test(encodedPayload) || !CHECKSUM.test(checksum)) {
    return null
  }
  if (sha512(stringToUtf8Bytes(encodedPayload)) !== checksum) {
    return null
  }

  const payloadJson = base64ToString(encodedPayload)

  if (payloadJson === null) {
    return null
  }

  let payload: unknown

  try {
    payload = JSON.parse(payloadJson)
  } catch (error) {
    return null
  }

  if (!isPlainObject(payload)) {
    return null
  }

  const rawProducts = payload.products

  if (!isPlainObject(rawProducts)) {
    return null
  }

  const products = {}
  let malformed = false

  Object.keys(rawProducts).forEach((name) => {
    const entry = normalizeProductEntry(rawProducts[name])

    if (entry === null) {
      malformed = true

      return
    }

    defineOwn(products, name, entry)
  })

  if (malformed) {
    return null
  }

  return {products}
}
