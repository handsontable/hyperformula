/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/typed-key/extract-key-data.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 *
 * Two deliberate divergences from upstream, both recorded in the manifest: the custom-schema
 * parameter is dropped (HyperFormula always reads with {@link DEFAULT_TYPED_KEY_SCHEMA}, so
 * upstream's `validateTypedKeySchema` branch is unreachable here), and the result additionally
 * carries {@link TypedKeyData.licensedProductName} so a caller can find the grace period without
 * re-implementing the licensed-product rule.
 */

import {TYPED_KEY_CHECKSUM_LENGTH, TYPED_KEY_SUPPORTED_VERSIONS} from './constants'
import {DEFAULT_TYPED_KEY_SCHEMA} from './defaultSchema'
import {sha512} from './sha512'
import {base64ToString, parseIsoDate, stringToUtf8Bytes} from './utils'

/**
 * One product entry of a typed key payload.
 *
 * Every field is typed `unknown` on purpose. Field types are checked when a key is generated,
 * which constrains nothing about a payload that actually reaches this code, and the checksum
 * establishes only that the payload arrived intact. Every consumer must therefore narrow a
 * field before using it rather than trusting its declared shape.
 */
export interface TypedKeyProductGrant {
  readonly tier?: unknown,
  readonly mode?: unknown,
  readonly addons?: unknown,
  readonly exp?: unknown,
  readonly grace?: unknown,
}

/**
 * A typed key payload. Only `v` is verified before this type is handed out (against
 * {@link TYPED_KEY_SUPPORTED_VERSIONS}); see {@link TypedKeyProductGrant} for why the rest is
 * `unknown`.
 */
export interface TypedKeyPayload {
  readonly v: number,
  readonly products: Readonly<Record<string, TypedKeyProductGrant>>,
  readonly ref?: unknown,
  readonly holder?: unknown,
  readonly iss?: unknown,
}

/**
 * The machine-readable content of an intact typed license key.
 */
export interface TypedKeyData {
  /** One of `'trial'`, `'freemium'`, `'subscription'`, `'perpetual'`. */
  readonly keyType: string,
  readonly payload: TypedKeyPayload,
  /**
   * The expiration time derived from the payload, as epoch milliseconds; `null` means the key
   * never expires. `null` rather than a number is deliberate — a real timestamp of `0` (a key
   * dated 1970-01-01) must stay distinguishable from "never".
   */
  readonly expiryTimestamp: number | null,
  /**
   * The name of the licensed product: the first schema product present in the payload. It is the
   * only entry allowed to carry `exp` and `grace`, so a key granting both Handsontable and
   * HyperFormula carries its expiry and grace period on the Handsontable entry.
   */
  readonly licensedProductName: string,
}

/**
 * The licensed product of a payload, together with the expiration time derived from it.
 */
interface LicensedProduct {
  readonly name: string,
  readonly expiryTimestamp: number | null,
}

/**
 * Resolves the licensed product of the payload and derives its expiration time. The expiration
 * date (`exp`, in the `YYYY-MM-DD` format) is converted to epoch milliseconds (UTC midnight). A
 * payload without the expiration date (a freemium key) maps to `null`, which means the key never
 * expires. Returns `null` when the payload does not have the expected shape.
 *
 * Upstream returns only the timestamp, using `undefined` as its "malformed" sentinel because
 * `null` already means "never expires"; folding the product name in lets this return one
 * unambiguous `null` instead.
 *
 * @param {TypedKeyPayload} payload - the key payload
 */
function resolveLicensedProduct(payload: TypedKeyPayload): LicensedProduct | null {
  const {products} = payload

  if (products === null || typeof products !== 'object' || Array.isArray(products)) {
    return null
  }

  const schemaProductNames = DEFAULT_TYPED_KEY_SCHEMA.products.map((schemaProduct) => schemaProduct.name)

  // A payload granting a product this schema does not know cannot be read reliably - the
  // licensed product (and so the expiry) could be resolved wrongly. Reject it instead of
  // guessing; product lists are append-only and the reading side has to know at least as much as
  // the generating one.
  if (Object.keys(products).some((name) => schemaProductNames.indexOf(name) === -1)) {
    return null
  }

  // The licensed product is the first schema product present in the payload (the schema order
  // defines the priority). Presence is read own-property only, so an inherited prototype-chain
  // property cannot masquerade as a granted product.
  const hasOwn = (name: string) => Object.prototype.hasOwnProperty.call(products, name)
  const licensedProductName = schemaProductNames.find(hasOwn)
  const licensedProduct = licensedProductName === undefined ? undefined : products[licensedProductName]

  if (licensedProductName === undefined || licensedProduct === undefined || licensedProduct === null
      || typeof licensedProduct !== 'object' || Array.isArray(licensedProduct)) {
    return null
  }
  if (licensedProduct.exp === undefined) {
    return {name: licensedProductName, expiryTimestamp: null}
  }

  try {
    return {name: licensedProductName, expiryTimestamp: parseIsoDate(String(licensedProduct.exp), 'expiration').timestamp}
  } catch (error) {
    // A malformed or impossible date - such a payload is not trustworthy.
    return null
  }
}

/**
 * Extracts the machine-readable data from a typed license key (`[TRIAL]`, `[FREE]`, `[SUB]` or
 * `[PERP]`). The function verifies the checksum first, so the returned data is guaranteed to
 * belong to an intact key. For a malformed or tampered key `null` is returned.
 *
 * The expiration time itself is not checked here — it is up to the caller to compare it against
 * the current time (trial, subscription) or the build release date (perpetual).
 *
 * @param {string} licenseKey - the license key to extract the data from
 */
export function extractTypedKeyData(licenseKey: string): TypedKeyData | null {
  // The key alphabet has no whitespace, so trimming is lossless - keys are commonly pasted with
  // a trailing newline (email, terminal).
  const key = `${licenseKey}`.trim()
  const keyType = Object.keys(DEFAULT_TYPED_KEY_SCHEMA.keyTypes)
    .find((type) => key.indexOf(`${DEFAULT_TYPED_KEY_SCHEMA.keyTypes[type].tag}_`) === 0)

  if (keyType === undefined) {
    return null
  }
  if (key.length <= TYPED_KEY_CHECKSUM_LENGTH) {
    return null
  }

  const keyBody = key.slice(0, -TYPED_KEY_CHECKSUM_LENGTH)
  const checksum = key.slice(-TYPED_KEY_CHECKSUM_LENGTH)

  if (!/^[0-9a-f]+$/.test(checksum)) {
    return null
  }
  if (sha512(stringToUtf8Bytes(keyBody)) !== checksum) {
    return null
  }

  // The quadruple underscore separates the human-readable part from the machine-readable one.
  // The LAST occurrence is used - the payload (base64 of valid UTF-8) can never contain four
  // consecutive underscores, while the human-readable part could (underscore runs are sanitized
  // at generation, but a lenient search keeps the parser robust).
  const separatorIndex = keyBody.lastIndexOf('____')

  if (separatorIndex === -1) {
    return null
  }

  // The machine-readable part is the payload encoded as URL-safe base64.
  const payloadJson = base64ToString(keyBody.slice(separatorIndex + 4))

  if (payloadJson === null) {
    return null
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(payloadJson)
  } catch (error) {
    return null
  }

  if (parsed === null || typeof parsed !== 'object') {
    return null
  }

  const payload = parsed as TypedKeyPayload

  // Keys stamped with a format version this library does not know are not readable - the format
  // version describes HOW the key is parsed.
  if (TYPED_KEY_SUPPORTED_VERSIONS.indexOf(payload.v) === -1) {
    return null
  }

  const licensedProduct = resolveLicensedProduct(payload)

  if (licensedProduct === null) {
    return null
  }

  return {
    keyType,
    payload,
    expiryTimestamp: licensedProduct.expiryTimestamp,
    licensedProductName: licensedProduct.name,
  }
}
